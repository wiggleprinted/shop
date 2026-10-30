# 3D Printed Toys E-Commerce Storefront

## Project Overview
A static frontend e-commerce website designed to sell 3D-printed articulated toys, fidgets, and accessories. The site utilizes a high-contrast, dark-mode design system optimized to make brightly colored PLA filaments pop.

## Design System: "Electric Neon & Dark Slate"

| Element | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas** | Deep Slate | `#0F172A` | Primary background color |
| **Surfaces** | Dark Navy | `#1E293B` | Nav bars, product cards, sidebars, mega menus |
| **Primary Text** | Off-White | `#F8FAFC` | Headlines, product titles, main copy |
| **Secondary Text**| Slate Muted | `#94A3B8` | Breadcrumbs, metadata, specs |
| **Primary CTA** | Electric Cyan | `#06B6D4` | "Add to Bag" buttons, active states |
| **Badges** | Neon Coral | `#F43F5E` | "New" items, sale alerts, urgency |
| **Trust/Promo** | Mint Green | `#10B981` | "2x Points", shipping, security seals |

## Content Management (Decap CMS)
This project uses Decap CMS to provide a visual dashboard for managing product inventory without editing code. 

### How to Manage Products
1. Navigate to `yourdomain.com/admin` in your browser.
2. Log in using your configured authentication (e.g., Netlify Identity).
3. Click on the **Products** collection in the left sidebar.
4. Click **New Product** to open the visual editor.
5. Upload your product photos, set the title, price, badges (e.g., "New", "2x Points"), and paste your Stripe/PayPal checkout link.
6. Click **Publish**. 

*Note: Publishing a product through the CMS automatically commits a JSON file to the GitHub repository, which triggers your hosting provider to rebuild and update the live website.*

## Layout Architecture

### 1. Global Navigation & Mega Menu
*   **Sticky Header:** Contains branding, search, user icons, and primary category links.
*   **Mega Menu Dropdown:** A large, two-column interactive panel for deep navigation.
    *   **Left Column:** Text-based list of parent categories with directional arrows.
    *   **Right Column:** A visual grid utilizing circular thumbnail icons with text labels for child categories.
    *   **Promo Footer:** Integrated shipping or promotional messaging at the bottom right corner.

### 2. Home Page (Landing Page)
*   **Hero Banner:** Full-width promotional stage for seasonal drops or flagship collections.
*   **Horizontal Product Carousel:** A single-row slider showcasing top products with category filter tabs above it.
*   **Promotional Grid:** A staggered, bento-box style layout combining vertical, horizontal, and full-width promotional content blocks.

### 3. Category Page (Product Grid)
*   **Grid Structure:** Responsive CSS grid for browsing collections.
*   **Hero Card:** The first grid item spans two columns to highlight a specific item.
*   **Card Components:** Dynamically generated via JavaScript fetching Decap CMS data. Includes floating promo tags, spec lists, and split-action footers.

### 4. Product Detail Layout (PDP)
*   **Gallery:** Left-aligned vertical thumbnail carousel alongside a center-aligned main image stage.
*   **Action Module (Right side):** Stacked badges, Price, Title, Quantity selector, Primary Add to Cart CTA, and Trust badges.
*   **Details Section:** Collapsible accordion below the fold for features, layer height specs, and material safety info.