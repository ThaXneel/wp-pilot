=== OBMAT Connector ===
Contributors: obmat
Tags: saas, management, woocommerce, remote
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connects your WordPress site to the OBMAT platform for remote management of products, orders, and blog posts.

== Description ==

OBMAT Connector is a lightweight plugin that enables your WordPress site to communicate with the OBMAT dashboard. It provides secure REST API endpoints for:

* Managing WooCommerce products (create, read, update)
* Viewing WooCommerce orders
* Managing blog posts (create, read, update)
* Site health monitoring
* Automatic heartbeat reporting
* Real-time webhook events

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/obmat-connector/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Go to Settings → OBMAT to enter your API token
4. Your site will automatically connect to the OBMAT dashboard

== Changelog ==

= 1.0.0 =
* Initial release
* Products, Orders, Posts REST endpoints
* Health monitoring
* Heartbeat system
* Token-based authentication
