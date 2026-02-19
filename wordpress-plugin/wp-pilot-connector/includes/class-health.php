<?php
if (!defined('ABSPATH')) exit;

class WP_Pilot_Health {

    public function get_report() {
        global $wp_version;

        $theme = wp_get_theme();

        return rest_ensure_response([
            'wp_version' => $wp_version,
            'php_version' => phpversion(),
            'theme' => $theme->get('Name'),
            'active_plugins' => $this->get_active_plugins(),
            'woocommerce_active' => class_exists('WooCommerce'),
            'woocommerce_version' => defined('WC_VERSION') ? WC_VERSION : null,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'ssl' => is_ssl(),
            'site_url' => get_site_url(),
            'timestamp' => current_time('c'),
        ]);
    }

    private function get_active_plugins() {
        $active_plugins = get_option('active_plugins', []);
        $plugins = [];

        foreach ($active_plugins as $plugin_path) {
            $plugin_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin_path);
            $plugins[] = [
                'name' => $plugin_data['Name'],
                'version' => $plugin_data['Version'],
            ];
        }

        return $plugins;
    }
}
