# NE3XA Technology Company Website

Premium frontend website for NE3XA — software development, school management systems, programming education and laptop sales.

## Stack

- HTML5
- CSS3 (no gradients; solid colours, shadows, borders)
- Vanilla JavaScript
- localStorage for shopping cart

## How to view

Open `index.html` directly in a modern browser. All paths are relative; no server required for basic use.

## Pages

1. index.html — Home
2. about.html — About
3. services.html — Services (interactive detail panel)
4. software-development.html
5. web-development.html
6. mobile-app-development.html
7. school-management.html
8. programming-lessons.html (filter + search)
9. laptops.html (filter, sort, search)
10. product.html (dynamic product detail)
11. cart.html (localStorage cart)
12. checkout.html (form validation + confirmation)
13. projects.html (filter tabs)
14. blog.html (search + category filter)
15. contact.html (validated form)
16. faq.html (accordion)
17. Plus navigation links across the site

## Features

- Responsive navigation with dropdowns and mobile menu
- Working shopping cart with localStorage
- Product search, filters and sorting
- Course filtering by level and search
- Blog search and category filter
- Project portfolio filters
- Form validation on contact and checkout
- Scroll progress, reveal animations, back-to-top
- Accessible focus states and semantic HTML
- No gradient colours; white-dominant premium aesthetic

## Design notes

- Dominant white with black, charcoal, light grey
- Accent: teal (#0d9488)
- Subtle technical grid and floating shapes in hero
- Dashboard mockups built with HTML/CSS for the school system page

## Extending

Cart and checkout are frontend-only. To connect a backend, keep the same `NE3XA.cart` API and product data shape in `js/products.js`.
