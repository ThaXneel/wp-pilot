<?php
if (!defined('ABSPATH')) exit;

class WP_Pilot_Handshake {

    /**
     * Handle initial handshake verification from SaaS proxy.
     */
    public function verify($request) {
        global $wp_version;

        $site_url = get_site_url();

        return rest_ensure_response([
            'status' => 'ok',
            'wpUrl' => $site_url,
            'wpVersion' => $wp_version,
            'woocommerceActive' => class_exists('WooCommerce'),
            'pluginVersion' => WP_PILOT_VERSION,
        ]);
    }
}
