<?php
if (!defined('ABSPATH')) exit;

class WP_Pilot_Orders {

    public function list_orders($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_found', 'WooCommerce is not active.', ['status' => 400]);
        }

        $args = [
            'limit' => $request->get_param('limit') ?? 50,
            'page' => $request->get_param('page') ?? 1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        $orders = wc_get_orders($args);
        $data = [];

        foreach ($orders as $order) {
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

        return rest_ensure_response(['orders' => $data, 'total' => count($data)]);
    }

    public function count_orders() {
        if (!class_exists('WooCommerce')) {
            return rest_ensure_response(['count' => 0]);
        }

        $counts = wp_count_posts('shop_order');
        $total = 0;
        foreach ($counts as $count) {
            $total += (int) $count;
        }

        return rest_ensure_response(['count' => $total]);
    }
}
