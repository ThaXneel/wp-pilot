<?php
/**
 * Plugin Name: WP Pilot Connector
 * Plugin URI: https://wppilot.com
 * Description: Connects your WordPress site to the WP Pilot SaaS platform for remote management.
 * Version: 1.0.0
 * Author: WP Pilot
 * Author URI: https://wppilot.com
 * License: GPL v2 or later
 * Text Domain: wp-pilot-connector
 */

if (!defined('ABSPATH')) exit;

define('WP_PILOT_VERSION', '1.0.0');
define('WP_PILOT_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Includes
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-auth.php';
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-products.php';
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-orders.php';
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-posts.php';
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-health.php';
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-heartbeat.php';
require_once WP_PILOT_PLUGIN_DIR . 'includes/class-handshake.php';

class WP_Pilot_Connector {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);

        // Auto-handshake when settings are updated
        add_action('update_option_wp_pilot_api_token', [$this, 'try_handshake'], 10, 0);
        add_action('update_option_wp_pilot_saas_url', [$this, 'try_handshake'], 10, 0);

        // Initialize heartbeat cron
        $heartbeat = new WP_Pilot_Heartbeat();
        $heartbeat->init();
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

        $token   = get_option('wp_pilot_api_token', '');
        $saas_url = get_option('wp_pilot_saas_url', '');

        if (empty($token) || empty($saas_url)) {
            return;
        }

        // Don't handshake again if we already have a site ID
        $site_id = get_option('wp_pilot_site_id', '');
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
            add_settings_error('wp_pilot_settings', 'handshake_failed',
                'WP Pilot handshake failed: ' . $response->get_error_message(), 'error');
            return;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status_code === 200 && !empty($body['success']) && !empty($body['data'])) {
            // Store the permanent API token and site ID returned by the SaaS
            if (!empty($body['data']['apiToken'])) {
                update_option('wp_pilot_api_token', $body['data']['apiToken']);
            }
            if (!empty($body['data']['siteId'])) {
                update_option('wp_pilot_site_id', $body['data']['siteId']);
            }
            add_settings_error('wp_pilot_settings', 'handshake_success',
                'Successfully connected to WP Pilot!', 'updated');
        } else {
            $error_msg = !empty($body['error']) ? $body['error'] : 'Unknown error (HTTP ' . $status_code . ')';
            add_settings_error('wp_pilot_settings', 'handshake_failed',
                'WP Pilot handshake failed: ' . $error_msg, 'error');
        }
    }

    public function register_routes() {
        $auth = new WP_Pilot_Auth();
        $products = new WP_Pilot_Products();
        $orders = new WP_Pilot_Orders();
        $posts = new WP_Pilot_Posts();
        $health = new WP_Pilot_Health();
        $handshake = new WP_Pilot_Handshake();

        $namespace = 'saas-connector/v1';

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
            'methods' => 'PUT',
            'callback' => [$products, 'update_product'],
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
            'methods' => 'PUT',
            'callback' => [$posts, 'update_post'],
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
            'WP Pilot Connector',
            'WP Pilot',
            'manage_options',
            'wp-pilot-connector',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('wp_pilot_settings', 'wp_pilot_api_token');
        register_setting('wp_pilot_settings', 'wp_pilot_saas_url');
        register_setting('wp_pilot_settings', 'wp_pilot_site_id');
    }

    public function render_settings_page() {
        $token = get_option('wp_pilot_api_token', '');
        $saas_url = get_option('wp_pilot_saas_url', '');
        $site_id = get_option('wp_pilot_site_id', '');
        $is_connected = !empty($site_id);

        // Show settings errors/notices from handshake
        settings_errors('wp_pilot_settings');
        ?>
        <div class="wrap">
            <h1>WP Pilot Connector</h1>

            <?php if ($is_connected): ?>
                <div class="notice notice-success">
                    <p><strong>✅ Connected to WP Pilot.</strong> Site ID: <code><?php echo esc_html($site_id); ?></code></p>
                </div>
            <?php endif; ?>

            <form method="post" action="options.php">
                <?php settings_fields('wp_pilot_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th>API Token</th>
                        <td>
                            <input type="text" name="wp_pilot_api_token" value="<?php echo esc_attr($token); ?>" class="regular-text" />
                            <p class="description"><?php echo $is_connected ? 'Permanent API token (auto-assigned after handshake).' : 'Paste the connect token from your WP Pilot dashboard.'; ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th>SaaS URL</th>
                        <td>
                            <input type="url" name="wp_pilot_saas_url" value="<?php echo esc_attr($saas_url); ?>" class="regular-text" />
                            <p class="description">The URL of your WP Pilot backend (e.g., https://api.wppilot.com).</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Site ID</th>
                        <td>
                            <input type="text" name="wp_pilot_site_id" value="<?php echo esc_attr($site_id); ?>" class="regular-text" readonly />
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

new WP_Pilot_Connector();
