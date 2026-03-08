<?php
if (!defined('ABSPATH')) exit;

class OBMAT_Orders {

    public function list_orders($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_found', 'WooCommerce is not active.', ['status' => 400]);
        }

        $args = [
            'limit' => absint($request->get_param('limit') ?? 50),
            'page' => absint($request->get_param('page') ?? 1),
            'orderby' => 'date',
            'order' => 'DESC',
            'paginate' => true,
        ];

        try {
            $results = wc_get_orders($args);
        } catch (\Throwable $e) {
            return new WP_Error('orders_query_failed', 'Failed to query orders: ' . $e->getMessage(), ['status' => 500]);
        }

        $data = [];

        foreach ($results->orders as $order) {
            try {
                $date_created = null;
                try {
                    $date_obj = $order->get_date_created();
                    $date_created = $date_obj ? $date_obj->format('c') : null;
                } catch (\Throwable $e) {
                    $date_created = null;
                }

                $data[] = [
                    'id' => $order->get_id(),
                    'number' => (string) ($order->get_order_number() ?? $order->get_id()),
                    'status' => $order->get_status() ?? 'unknown',
                    'total' => $order->get_total() ?? '0',
                    'currency' => $order->get_currency() ?? 'USD',
                    'customer_name' => trim(
                        ($order->get_billing_first_name() ?? '') . ' ' . ($order->get_billing_last_name() ?? '')
                    ),
                    'customer_email' => $order->get_billing_email() ?? '',
                    'items_count' => $order->get_item_count() ?? 0,
                    'created_at' => $date_created,
                ];
            } catch (\Throwable $e) {
                // Skip orders that cause fatal errors but log it
                $data[] = [
                    'id' => method_exists($order, 'get_id') ? $order->get_id() : 0,
                    'number' => 'error',
                    'status' => 'error',
                    'total' => '0',
                    'currency' => 'USD',
                    'customer_name' => 'Error loading order',
                    'customer_email' => '',
                    'items_count' => 0,
                    'created_at' => null,
                    '_error' => $e->getMessage(),
                ];
            }
        }

        return rest_ensure_response(['orders' => $data, 'total' => $results->total]);
    }

    public function count_orders() {
        if (!class_exists('WooCommerce')) {
            return rest_ensure_response(['count' => 0]);
        }

        // Use wc_get_orders() instead of wp_count_posts('shop_order')
        // because HPOS (default since WooCommerce 8.2+) stores orders
        // in the wc_orders table, not as wp_posts.
        $results = wc_get_orders([
            'limit'    => 1,
            'return'   => 'ids',
            'paginate' => true,
        ]);

        return rest_ensure_response(['count' => (int) $results->total]);
    }
}
