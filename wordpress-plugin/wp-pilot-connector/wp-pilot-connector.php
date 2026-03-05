<?php
/**
 * Plugin Name: OBMAT
 * Plugin URI: https://obmat.com
 * Description: OBMAT — Online Business Manager Tool Connector. Real-time sync between WordPress/WooCommerce and the OBMAT dashboard.
 * Version: 1.0.0
 * Author: NEXNEEL
 * Author URI: https://nexneel.com
 * License: GPL v2 or later
 * Text Domain: obmat-connector
 */

if (!defined('ABSPATH')) exit;

define('OBMAT_VERSION', '1.0.0');
define('OBMAT_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Includes
require_once OBMAT_PLUGIN_DIR . 'includes/class-auth.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-products.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-orders.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-posts.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-health.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-heartbeat.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-handshake.php';
require_once OBMAT_PLUGIN_DIR . 'includes/class-webhooks.php';

class OBMAT_Connector {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);

        // Auto-handshake when settings are updated
        // Clear the cached site ID so that a new connect token triggers a fresh handshake
        add_action('update_option_obmat_api_token', function () {
            delete_option('obmat_site_id');
        }, 5, 0);
        add_action('update_option_obmat_api_token', [$this, 'try_handshake'], 10, 0);

        // Initialize heartbeat cron
        $heartbeat = new OBMAT_Heartbeat();
        $heartbeat->init();

        // Initialize webhook event listeners for real-time sync
        $webhooks = new OBMAT_Webhooks();
        $webhooks->init();
    }

    /**
     * Attempt handshake with the SaaS backend after settings are saved.
     * Sends the connect token + WordPress site info to the SaaS to complete the connection.
     */
    public function try_handshake() {
        // Avoid running multiple times during the same request
        static $already_ran = false;
        if ($already_ran) return;
        $already_ran = true;

        $token = get_option('obmat_api_token', '');

        // Backend URL from wp-config.php constant, fallback to option (legacy)
        $saas_url = defined('OBMAT_API_URL') ? OBMAT_API_URL : get_option('obmat_saas_url', '');

        if (empty($token) || empty($saas_url)) {
            return;
        }

        // Don't handshake again if we already have a site ID
        $site_id = get_option('obmat_site_id', '');
        if (!empty($site_id)) {
            return;
        }

        global $wp_version;

        $saas_url = rtrim($saas_url, '/');

        $response = wp_remote_post($saas_url . '/api/onboarding/handshake', [
            'body'    => wp_json_encode([
                'token'     => $token,
                'wpUrl'     => get_site_url(),
                'wpVersion' => $wp_version,
                'siteName'  => get_bloginfo('name'),
            ]),
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            add_settings_error('obmat_settings', 'handshake_failed',
                'OBMAT handshake failed: ' . $response->get_error_message(), 'error');
            return;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status_code === 200 && !empty($body['success']) && !empty($body['data'])) {
            // Store the permanent API token and site ID returned by the SaaS
            if (!empty($body['data']['apiToken'])) {
                update_option('obmat_api_token', $body['data']['apiToken']);
            }
            if (!empty($body['data']['siteId'])) {
                update_option('obmat_site_id', $body['data']['siteId']);
            }
            add_settings_error('obmat_settings', 'handshake_success',
                'Successfully connected to OBMAT!', 'updated');
        } else {
            $error_msg = !empty($body['error']) ? $body['error'] : 'Unknown error (HTTP ' . $status_code . ')';
            add_settings_error('obmat_settings', 'handshake_failed',
                'OBMAT handshake failed: ' . $error_msg, 'error');
        }
    }

    public function register_routes() {
        $auth = new OBMAT_Auth();
        $products = new OBMAT_Products();
        $orders = new OBMAT_Orders();
        $posts = new OBMAT_Posts();
        $health = new OBMAT_Health();
        $handshake = new OBMAT_Handshake();

        $namespace = 'obmat-connector/v1';

        // Handshake
        register_rest_route($namespace, '/handshake', [
            'methods' => 'POST',
            'callback' => [$handshake, 'verify'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);

        // Health
        register_rest_route($namespace, '/health', [
            'methods' => 'GET',
            'callback' => [$health, 'get_report'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);

        // Products
        register_rest_route($namespace, '/products', [
            'methods' => 'GET',
            'callback' => [$products, 'list_products'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/products', [
            'methods' => 'POST',
            'callback' => [$products, 'create_product'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/products/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$products, 'get_product'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/products/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$products, 'update_product'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/products/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$products, 'delete_product'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/products/count', [
            'methods' => 'GET',
            'callback' => [$products, 'count_products'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);

        // Orders
        register_rest_route($namespace, '/orders', [
            'methods' => 'GET',
            'callback' => [$orders, 'list_orders'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/orders/count', [
            'methods' => 'GET',
            'callback' => [$orders, 'count_orders'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);

        // Posts
        register_rest_route($namespace, '/posts', [
            'methods' => 'GET',
            'callback' => [$posts, 'list_posts'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/posts', [
            'methods' => 'POST',
            'callback' => [$posts, 'create_post'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/posts/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$posts, 'get_post'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/posts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$posts, 'update_post'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/posts/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$posts, 'delete_post'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
        register_rest_route($namespace, '/posts/count', [
            'methods' => 'GET',
            'callback' => [$posts, 'count_posts'],
            'permission_callback' => [$auth, 'validate_token'],
        ]);
    }

    public function add_settings_page() {
        add_options_page(
            'OBMAT Connector',
            'OBMAT',
            'manage_options',
            'obmat-connector',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('obmat_settings', 'obmat_api_token');
        register_setting('obmat_settings', 'obmat_site_id');
    }

    public function render_settings_page() {
        $token = get_option('obmat_api_token', '');
        $site_id = get_option('obmat_site_id', '');
        $is_connected = !empty($site_id);
        $saas_url = defined('OBMAT_API_URL') ? OBMAT_API_URL : get_option('obmat_saas_url', '');

        // Show settings errors/notices from handshake
        settings_errors('obmat_settings');
        ?>
        <div class="wrap">
            <h1>OBMAT — Online Business Manager Tool</h1>
            <p class="description">Developed by <strong>NEXNEEL</strong></p>

            <?php if (empty($saas_url)): ?>
                <div class="notice notice-warning">
                    <p><strong>⚠️ Backend URL not configured.</strong> Add <code>define('OBMAT_API_URL', 'https://api.obmat.com');</code> to your <code>wp-config.php</code> file.</p>
                </div>
            <?php endif; ?>

            <?php if ($is_connected): ?>
                <div class="notice notice-success">
                    <p><strong>✅ Connected to OBMAT.</strong> Site ID: <code><?php echo esc_html($site_id); ?></code></p>
                </div>
            <?php endif; ?>

            <form method="post" action="options.php">
                <?php settings_fields('obmat_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th>API Token</th>
                        <td>
                            <input type="text" name="obmat_api_token" value="<?php echo esc_attr($token); ?>" class="regular-text" />
                            <p class="description"><?php echo $is_connected ? 'Permanent API token (auto-assigned after handshake).' : 'Paste the connect token from your OBMAT dashboard.'; ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th>Backend URL</th>
                        <td>
                            <code><?php echo esc_html(!empty($saas_url) ? $saas_url : '— not set —'); ?></code>
                            <p class="description">Configured via <code>OBMAT_API_URL</code> constant in <code>wp-config.php</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Site ID</th>
                        <td>
                            <input type="text" name="obmat_site_id" value="<?php echo esc_attr($site_id); ?>" class="regular-text" readonly />
                            <p class="description">Auto-assigned after successful connection.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <?php if ($is_connected): ?>
                <h2>Reconnect</h2>
                <p>To reconnect with a new token, clear the Site ID field value and save a new connect token.</p>
            <?php endif; ?>
        </div>
        <?php
    }
}

new OBMAT_Connector();
