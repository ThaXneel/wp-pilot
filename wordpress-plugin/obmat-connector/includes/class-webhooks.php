<?php
/**
 * OBMAT Webhooks — Real-Time Event Push System
 *
 * Hooks into WordPress and WooCommerce actions to push events
 * to the OBMAT SaaS backend instantly via webhooks.
 *
 * Events supported:
 * - New orders / order status changes
 * - New product creation / product updates
 * - New comments
 * - Post publishing / updates
 *
 * @package OBMAT
 * @author NEXNEEL
 */

if (!defined('ABSPATH')) exit;

class OBMAT_Webhooks {

    /**
     * Register all WordPress/WooCommerce hooks for real-time sync.
     */
    public function init() {
        // WooCommerce Order hooks
        add_action('woocommerce_new_order', [$this, 'on_new_order'], 10, 2);
        add_action('woocommerce_order_status_changed', [$this, 'on_order_status_changed'], 10, 4);

        // WooCommerce Product hooks
        add_action('woocommerce_new_product', [$this, 'on_product_created'], 10, 1);
        add_action('woocommerce_update_product', [$this, 'on_product_updated'], 10, 2);
        add_action('before_delete_post', [$this, 'on_product_deleted'], 10, 1);

        // WordPress Post hooks
        add_action('publish_post', [$this, 'on_post_published'], 10, 2);
        add_action('save_post', [$this, 'on_post_updated'], 10, 3);

        // WordPress Comment hooks
        add_action('wp_insert_comment', [$this, 'on_new_comment'], 10, 2);
        add_action('transition_comment_status', [$this, 'on_comment_status_changed'], 10, 3);
    }

    // ─── ORDER EVENTS ──────────────────────────────────────────

    public function on_new_order($order_id, $order = null) {
        if (!class_exists('WooCommerce')) return;

        if (!$order) $order = wc_get_order($order_id);
        if (!$order) return;

        $this->push_event('order.created', [
            'id'            => $order->get_id(),
            'number'        => $order->get_order_number(),
            'status'        => $order->get_status(),
            'total'         => $order->get_total(),
            'currency'      => $order->get_currency(),
            'customerName'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            'customerEmail' => $order->get_billing_email(),
            'itemsCount'    => $order->get_item_count(),
            'createdAt'     => $order->get_date_created()?->format('c'),
        ]);
    }

    public function on_order_status_changed($order_id, $old_status, $new_status, $order) {
        $this->push_event('order.status_changed', [
            'id'        => $order_id,
            'oldStatus' => $old_status,
            'newStatus' => $new_status,
            'total'     => $order->get_total(),
            'currency'  => $order->get_currency(),
        ]);
    }

    // ─── PRODUCT EVENTS ────────────────────────────────────────

    public function on_product_created($product_id) {
        if (!class_exists('WooCommerce')) return;

        $product = wc_get_product($product_id);
        if (!$product) return;

        $this->push_event('product.created', [
            'id'        => $product->get_id(),
            'title'     => $product->get_name(),
            'price'     => $product->get_regular_price(),
            'status'    => $product->get_status(),
            'image'     => wp_get_attachment_url($product->get_image_id()) ?: null,
            'createdAt' => $product->get_date_created()?->format('c'),
        ]);
    }

    public function on_product_updated($product_id, $product = null) {
        if (!class_exists('WooCommerce')) return;

        if (!$product) $product = wc_get_product($product_id);
        if (!$product) return;

        // Avoid duplicate firing during creation
        if (did_action('woocommerce_new_product') > 0) return;

        $this->push_event('product.updated', [
            'id'        => $product->get_id(),
            'title'     => $product->get_name(),
            'price'     => $product->get_regular_price(),
            'status'    => $product->get_status(),
            'image'     => wp_get_attachment_url($product->get_image_id()) ?: null,
            'updatedAt' => $product->get_date_modified()?->format('c'),
        ]);
    }

    public function on_product_deleted($post_id) {
        if (get_post_type($post_id) !== 'product') return;

        $this->push_event('product.deleted', [
            'id' => $post_id,
        ]);
    }

    // ─── POST EVENTS ───────────────────────────────────────────

    public function on_post_published($post_id, $post) {
        if ($post->post_type !== 'post') return;

        $this->push_event('post.published', [
            'id'        => $post->ID,
            'title'     => $post->post_title,
            'status'    => $post->post_status,
            'author'    => get_the_author_meta('display_name', $post->post_author),
            'createdAt' => get_the_date('c', $post),
        ]);
    }

    public function on_post_updated($post_id, $post, $update) {
        if (!$update) return;
        if ($post->post_type !== 'post') return;
        if (wp_is_post_revision($post_id)) return;

        // Avoid duplicate with publish_post
        if (did_action('publish_post') > 0 && $post->post_status === 'publish') return;

        $this->push_event('post.updated', [
            'id'        => $post->ID,
            'title'     => $post->post_title,
            'status'    => $post->post_status,
            'author'    => get_the_author_meta('display_name', $post->post_author),
            'updatedAt' => get_the_modified_date('c', $post),
        ]);
    }

    // ─── COMMENT EVENTS ────────────────────────────────────────

    public function on_new_comment($comment_id, $comment) {
        $this->push_event('comment.created', [
            'id'        => $comment_id,
            'postId'    => $comment->comment_post_ID,
            'author'    => $comment->comment_author,
            'email'     => $comment->comment_author_email,
            'content'   => wp_trim_words($comment->comment_content, 50),
            'status'    => $comment->comment_approved,
            'createdAt' => $comment->comment_date,
        ]);
    }

    public function on_comment_status_changed($new_status, $old_status, $comment) {
        $this->push_event('comment.status_changed', [
            'id'        => $comment->comment_ID,
            'postId'    => $comment->comment_post_ID,
            'oldStatus' => $old_status,
            'newStatus' => $new_status,
        ]);
    }

    // ─── PUSH ENGINE ───────────────────────────────────────────

    /**
     * Push an event to the OBMAT SaaS backend.
     *
     * @param string $event_type The event identifier (e.g., 'order.created')
     * @param array  $payload    Event-specific data
     * @return void
     */
    private function push_event($event_type, $payload) {
        $saas_url  = defined('OBMAT_API_URL') ? OBMAT_API_URL : get_option('obmat_saas_url', '');
        $api_token = get_option('obmat_api_token', '');
        $site_id   = get_option('obmat_site_id', '');

        // Skip if not connected
        if (empty($saas_url) || empty($api_token) || empty($site_id)) {
            return;
        }

        $saas_url = rtrim($saas_url, '/');

        $body = wp_json_encode([
            'siteId'    => $site_id,
            'event'     => $event_type,
            'payload'   => $payload,
            'timestamp' => current_time('c'),
        ]);

        // Non-blocking: use wp_remote_post with short timeout
        // For truly async, use wp_schedule_single_event or Action Scheduler
        wp_remote_post($saas_url . '/api/webhooks/receive', [
            'body'      => $body,
            'headers'   => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $api_token,
                'X-OBMAT-Event' => $event_type,
                'X-OBMAT-Site'  => $site_id,
            ],
            'timeout'   => 5,
            'blocking'  => false, // Non-blocking for performance
        ]);
    }
}
