<?php
if (!defined('ABSPATH')) exit;

class WP_Pilot_Products {

    public function list_products($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_found', 'WooCommerce is not active.', ['status' => 400]);
        }

        $args = [
            'status' => 'any',
            'limit' => $request->get_param('limit') ?? 50,
            'page' => $request->get_param('page') ?? 1,
        ];

        $products = wc_get_products($args);
        $data = [];

        foreach ($products as $product) {
            $data[] = $this->format_product($product);
        }

        return rest_ensure_response(['products' => $data, 'total' => count($data)]);
    }

    public function create_product($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_found', 'WooCommerce is not active.', ['status' => 400]);
        }

        $product = new WC_Product_Simple();
        $product->set_name($request->get_param('title'));
        $product->set_description($request->get_param('description') ?? '');
        $product->set_regular_price($request->get_param('price'));
        $product->set_status($request->get_param('status') ?? 'draft');
        $product->save();

        return rest_ensure_response($this->format_product($product));
    }

    public function update_product($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_found', 'WooCommerce is not active.', ['status' => 400]);
        }

        $product = wc_get_product($request->get_param('id'));
        if (!$product) {
            return new WP_Error('product_not_found', 'Product not found.', ['status' => 404]);
        }

        if ($request->get_param('title')) $product->set_name($request->get_param('title'));
        if ($request->get_param('description')) $product->set_description($request->get_param('description'));
        if ($request->get_param('price') !== null) $product->set_regular_price($request->get_param('price'));
        if ($request->get_param('status')) $product->set_status($request->get_param('status'));
        $product->save();

        return rest_ensure_response($this->format_product($product));
    }

    public function count_products() {
        if (!class_exists('WooCommerce')) {
            return rest_ensure_response(['count' => 0]);
        }

        $counts = wp_count_posts('product');
        $total = ($counts->publish ?? 0) + ($counts->draft ?? 0);

        return rest_ensure_response(['count' => $total]);
    }

    private function format_product($product) {
        return [
            'id' => $product->get_id(),
            'title' => $product->get_name(),
            'description' => $product->get_description(),
            'price' => $product->get_regular_price(),
            'status' => $product->get_status(),
            'image' => wp_get_attachment_url($product->get_image_id()) ?: null,
            'created_at' => $product->get_date_created()?->format('c'),
            'updated_at' => $product->get_date_modified()?->format('c'),
        ];
    }
}
