<?php
if (!defined('ABSPATH')) exit;

class WP_Pilot_Posts {

    public function list_posts($request) {
        $args = [
            'post_type' => 'post',
            'post_status' => ['publish', 'draft'],
            'posts_per_page' => $request->get_param('limit') ?? 50,
            'paged' => $request->get_param('page') ?? 1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        $query = new WP_Query($args);
        $data = [];

        foreach ($query->posts as $post) {
            $data[] = [
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
                'excerpt' => $post->post_excerpt,
                'status' => $post->post_status,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'created_at' => get_the_date('c', $post),
                'updated_at' => get_the_modified_date('c', $post),
            ];
        }

        return rest_ensure_response(['posts' => $data, 'total' => $query->found_posts]);
    }

    public function create_post($request) {
        $post_id = wp_insert_post([
            'post_title' => $request->get_param('title'),
            'post_content' => $request->get_param('content') ?? '',
            'post_status' => $request->get_param('status') ?? 'draft',
            'post_type' => 'post',
        ], true);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $post = get_post($post_id);

        return rest_ensure_response([
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'status' => $post->post_status,
        ]);
    }

    public function update_post($request) {
        $post_id = $request->get_param('id');
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('post_not_found', 'Post not found.', ['status' => 404]);
        }

        $update_data = ['ID' => $post_id];
        if ($request->get_param('title')) $update_data['post_title'] = $request->get_param('title');
        if ($request->get_param('content')) $update_data['post_content'] = $request->get_param('content');
        if ($request->get_param('status')) $update_data['post_status'] = $request->get_param('status');

        $result = wp_update_post($update_data, true);
        if (is_wp_error($result)) {
            return $result;
        }

        $updated = get_post($post_id);

        return rest_ensure_response([
            'id' => $updated->ID,
            'title' => $updated->post_title,
            'content' => $updated->post_content,
            'status' => $updated->post_status,
        ]);
    }

    public function count_posts() {
        $counts = wp_count_posts('post');
        $total = ($counts->publish ?? 0) + ($counts->draft ?? 0);

        return rest_ensure_response(['count' => $total]);
    }
}
