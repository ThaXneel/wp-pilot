<?php
if (!defined('ABSPATH')) exit;

class WP_Pilot_Auth {

    /**
     * Validate Bearer token on incoming requests.
     */
    public function validate_token($request) {
        $auth_header = $request->get_header('Authorization');

        if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error('rest_forbidden', 'Missing or invalid authorization header.', ['status' => 401]);
        }

        $token = substr($auth_header, 7);
        $stored_token = get_option('wp_pilot_api_token', '');

        if (empty($stored_token) || !hash_equals($stored_token, $token)) {
            return new WP_Error('rest_forbidden', 'Invalid API token.', ['status' => 401]);
        }

        return true;
    }
}
