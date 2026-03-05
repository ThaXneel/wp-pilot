<?php
if (!defined('ABSPATH')) exit;

class OBMAT_Heartbeat {

    const CRON_HOOK = 'obmat_heartbeat_event';

    public function init() {
        add_action(self::CRON_HOOK, [$this, 'send_heartbeat']);

        // Schedule cron if not already scheduled
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'obmat_5min', self::CRON_HOOK);
        }

        // Register custom 5-min interval
        add_filter('cron_schedules', [$this, 'add_cron_interval']);
    }

    public function add_cron_interval($schedules) {
        $schedules['obmat_5min'] = [
            'interval' => 300,
            'display' => 'Every 5 Minutes (OBMAT)',
        ];
        return $schedules;
    }

    public function send_heartbeat() {
        $saas_url = defined('OBMAT_API_URL') ? OBMAT_API_URL : get_option('obmat_saas_url', 'https://api.nexneel.tools');
        $api_token = get_option('obmat_api_token', '');
        $site_id = get_option('obmat_site_id', '');

        if (empty($saas_url) || empty($api_token) || empty($site_id)) {
            return;
        }

        global $wp_version;

        $payload = [
            'siteId' => $site_id,
            'apiToken' => $api_token,
            'wpVersion' => $wp_version,
            'healthScore' => $this->calculate_health_score(),
            'errorCount' => $this->get_error_count(),
        ];

        wp_remote_post($saas_url . '/api/sites/heartbeat', [
            'body' => wp_json_encode($payload),
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'timeout' => 10,
        ]);
    }

    private function calculate_health_score() {
        $score = 100;

        // Deduct points for issues
        if (version_compare(phpversion(), '8.0', '<')) $score -= 10;
        if (!is_ssl()) $score -= 15;

        return max(0, $score);
    }

    private function get_error_count() {
        // Count recent PHP errors if WP_DEBUG_LOG is enabled
        $log_file = WP_CONTENT_DIR . '/debug.log';
        if (!file_exists($log_file)) return 0;

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) return 0;

        // Count errors from last 24 hours (simplified)
        return min(count(array_slice($lines, -100)), 100);
    }
}
