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

        $results = wc_get_orders($args);
        $data = [];

        foreach ($results->orders as $order) {
            $data[] = [
                'id' => $order->get_id(),
                'number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'currency' => $order->get_currency(),
                'customer_name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'customer_email' => $order->get_billing_email(),
                'items_count' => $order->get_item_count(),
                'created_at' => $order->get_date_created()?->format('c'),
            ];
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
