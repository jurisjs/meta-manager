# Juris MetaManager

A lean, zero-bloat headless component for dynamic meta tag management in Juris applications with intelligent SSR/Client detection, non-blocking operations, and real-time DOM updates.

## Features

- 🎯 **Zero Framework Bloat** - Pure headless component, no core modifications
- 🔄 **Smart Environment Detection** - Uses `isSSR` context flag for adaptive behavior
- ⚡ **Non-Blocking Operations** - Queued DOM updates with batched processing
- 🚀 **Real-time DOM Updates** - Client-side meta injection with immediate effect
- 📝 **Title Segment Management** - Hierarchical titles with state storage
- 🔗 **Global Promisify Integration** - Works with Juris promise tracking system
- 💾 **Memory Efficient** - DOM caching and optimized state subscriptions
- 🛡️ **XSS Protected** - Built-in HTML escaping
- 📱 **Reactive Updates** - Automatic title rebuilding on state changes
- 🎨 **Chainable API** - Fluent interface for better developer experience

## Environment Behavior

### SSR (Server-Side Rendering)

- Collects meta tags for HTML generation
- No DOM manipulation attempts
- Optimized for `getHTML()` output
- Integrates with framework promise tracking

### Client-Side

- Immediately injects meta tags into `document.head`
- Updates `document.title` in real-time
- Subscribes to title state changes for reactivity
- Non-blocking DOM operations with queue processing
- DOM caching for performance

## Installation

Simply add the MetaManager component to your Juris application - no additional dependencies required.

## Quick Start

```javascript
// Initialize with site defaults and title separator
const app = new Juris({
	headlessComponents: {
		meta: {
			fn: MetaManager,
			options: {
				autoInit: true,
				titleSeparator: " | ", // Custom separator
				defaults: {
					"og:site_name": "My Awesome Site",
					"twitter:card": "summary_large_image",
					viewport: "width=device-width, initial-scale=1",
				},
			},
		},
	},
});

// Use in components - meta directly available in context
const HomePage = (props, { meta, isSSR }) => {
	// Set hierarchical title
	meta.setTitle("Home", ["Welcome"]);

	// Set other meta (behavior adapts to environment)
	meta.setMeta({
		description: "Welcome to our homepage",
		"og:title": "Welcome Home",
		"og:image": "https://mysite.com/home-og.jpg",
	});

	if (isSSR) {
		console.log("Meta collected for SSR");
	} else {
		console.log("Meta injected to DOM immediately");
	}

	return { div: { text: "Welcome!" } };
};
```

## API Reference

### Core Methods

#### `set(key, value)`

Set a single meta tag with environment-aware, non-blocking behavior.

```javascript
// All operations return promises and are non-blocking
await meta.set("title", "Page Title");
// SSR: Collected for HTML generation
// Client: document.title updated asynchronously

await meta.set("og:title", "Social Title");
// SSR: Added to meta collection
// Client: <meta property="og:title"> injected to head asynchronously
```

#### `setMeta(object)`

Set multiple meta tags at once with batched processing.

```javascript
await meta.setMeta({
	title: "Product Page",
	description: "Amazing product description",
	"og:title": "Buy This Product",
	"og:image": "https://example.com/product.jpg",
});
// All tags processed with environment-appropriate behavior
// Client: DOM updates are queued and batched for performance
```

### Title Segment Management

#### `setTitle(main, segments = [])`

Set hierarchical title with automatic state storage and non-blocking updates.

```javascript
await meta.setTitle("Products", ["Electronics", "Laptops"]);
// Result: "Products | Electronics | Laptops"
// Stored in: ui.title.main, ui.title.segment1, ui.title.segment2
// Client: document.title updated asynchronously
```

#### `addTitleSegment(segment)`

Add a new segment to existing title with automatic rebuilding.

```javascript
meta.setTitle("Blog", ["Tech"]); // "Blog | Tech"
await meta.addTitleSegment("JavaScript"); // "Blog | Tech | JavaScript"
await meta.addTitleSegment("React"); // "Blog | Tech | JavaScript | React"
```

#### `removeTitleSegment(index)`

Remove a specific segment and compact the remaining ones.

```javascript
meta.setTitle("Store", ["Electronics", "Phones", "iPhone"]);
await meta.removeTitleSegment(2); // Remove 'Phones'
// Result: "Store | Electronics | iPhone"
```

#### `getTitleSegments()`

Get current title structure asynchronously.

```javascript
const titleInfo = await meta.getTitleSegments();
// {
//   main: 'Store',
//   segments: ['Electronics', 'iPhone'],
//   full: 'Store | Electronics | iPhone'
// }
```

### Data Retrieval

#### `get(key)` / `getAll()`

Get single or all meta values (synchronous).

```javascript
const title = meta.get("title");
const allMeta = meta.getAll();
```

#### `getHTML()`

Get all meta tags as HTML string (SSR only, non-blocking).

```javascript
const metaHTML = await meta.getHTML();
// <title>Store | Electronics | iPhone</title>
// <meta name="description" content="...">
// <meta property="og:title" content="...">
```

### Specialized Getters

#### `getOpenGraph()` / `getTwitterCard()` / `getTitles()`

Get specific meta tag types (synchronous).

```javascript
const ogTags = meta.getOpenGraph();
// { 'og:title': 'Title', 'og:description': 'Desc' }

const twitterTags = meta.getTwitterCard();
// { 'twitter:card': 'summary', 'twitter:title': 'Title' }

const titles = meta.getTitles();
// [{ title: 'Page Title' }]
```

### Utility Methods

#### `clear(key)` / `reset()`

Remove specific meta or clear all (non-blocking).

```javascript
await meta.clear("og:image"); // Remove specific
await meta.reset(); // Clear all
```

#### `update(object)` / `has(key)` / `count()`

Bulk update, check existence, and get count.

```javascript
await meta.update({ "og:updated_time": new Date().toISOString() });
const hasImage = meta.has("og:image");
const totalMeta = meta.count();
```

#### `getEnvironment()`

Get current environment and performance information.

```javascript
const env = meta.getEnvironment();
// {
//   isSSR: false,
//   titleSeparator: ' | ',
//   domCacheSize: 5,
//   queueSize: 0  // Number of pending DOM operations
// }
```

#### `serialize()` / `deserialize(json)`

Export/import for hydration and state persistence (non-blocking).

```javascript
const json = await meta.serialize();
// Includes both meta tags and title segments

await meta.deserialize(json);
// Restores complete state asynchronously
```

## Non-Blocking Operations

MetaManager ensures all operations are non-blocking to maintain optimal performance:

### Operation Queue System

```javascript
// Client-side: DOM operations are queued and batched
meta.setMeta({
	title: "Page 1",
	description: "Description 1",
	"og:title": "Social Title 1",
});

meta.setMeta({
	"og:image": "image.jpg",
	"twitter:card": "summary",
});

// All operations are processed in batches of 5 per tick
// Main thread never blocks
```

### Promise-Based API

```javascript
// Async/await style
const HomePage = async (props, { meta }) => {
	await meta.setTitle("Home", ["Welcome"]);
	await meta.setMeta({ description: "Homepage" });

	return { div: { text: "Home" } };
};

// Promise chain style
const ProductPage = (props, { meta }) => {
	meta
		.setTitle("Products", ["Electronics"])
		.then(() => meta.setMeta({ "og:title": "Buy Electronics" }))
		.catch((error) => console.warn("Meta update failed:", error));

	return { div: { text: "Products" } };
};

// Fire-and-forget style (non-blocking)
const QuickUpdate = (props, { meta }) => {
	meta.set("title", "Quick Page"); // Returns immediately
	meta.set("description", "Quick description");

	return { div: { text: "Content loads immediately" } };
};
```

### Framework Promise Tracking

```javascript
// MetaManager integrates with Juris global promisify
startTracking(); // Track all async operations including meta
meta.setTitle("Products", ["Electronics"]);
meta.setMeta({ description: "Buy electronics" });

onAllComplete(() => {
	console.log("All operations including meta completed!");
	// Perfect for SSR rendering
});
```

## Usage Patterns

### Basic Page Meta with Title Hierarchy

```javascript
const AboutPage = (props, { meta, isSSR }) => {
	// Hierarchical title (non-blocking)
	meta.setTitle("About", ["Company", "History"]);

	// Other meta tags (batched processing)
	meta.setMeta({
		description: "Learn about our company history and mission",
		"og:title": "Our Company History",
		"og:description": "Learn about our company history and mission",
		"og:url": "https://company.com/about/history",
	});

	return {
		div: {
			className: "about-page",
			children: [
				{ h1: { text: "About Our Company" } },
				{ p: { text: "Learn about our rich history and mission." } },
			],
		},
	};
};
```

### Dynamic Product Meta with Reactive Titles

```javascript
const ProductPage = (props, { getState, meta }) => {
	const product = getState("product.current");
	const category = getState("product.category");

	if (product) {
		// Dynamic title based on state
		meta.setTitle("Products", [category?.name || "All", product.name]);

		// Product-specific meta
		meta.setMeta({
			description: product.description,
			"og:title": product.name,
			"og:image": product.images[0],
			"og:price:amount": product.price,
			"og:price:currency": "USD",
			"product:brand": product.brand,
		});
	}

	return {
		div: {
			className: "product-page",
			children: [
				{ h1: { text: () => getState("product.current.name", "Loading...") } },
				{
					div: {
						className: "product-description",
						text: () => getState("product.current.description", ""),
					},
				},
				{
					div: {
						className: "product-price",
						text: () => `$${getState("product.current.price", 0)}`,
					},
				},
			],
		},
	};
};
```

### Search Results with Dynamic Title Updates

```javascript
const SearchResults = (props, { getState, meta }) => {
	const query = getState("search.query", "");
	const results = getState("search.results", []);
	const filters = getState("search.filters", {});

	// Title automatically updates when state changes (client-side)
	if (query) {
		const segments = [`"${query}"`];

		if (filters.category) {
			segments.push(`in ${filters.category}`);
		}

		segments.push(`${results.length} found`);

		meta.setTitle("Search", segments);
	}

	return {
		div: {
			className: "search-results",
			children: [
				{
					h2: {
						text: () => `Search Results for "${getState("search.query")}"`,
					},
				},
				{
					div: {
						className: "results-count",
						text: () =>
							`${getState("search.results", []).length} results found`,
					},
				},
				{
					div: {
						className: "results-list",
						children: () =>
							getState("search.results", []).map((result) => ({
								div: {
									className: "result-item",
									children: [
										{ h3: { text: result.title } },
										{ p: { text: result.description } },
									],
								},
							})),
					},
				},
			],
		},
	};
};
```

### Shopping Cart with Live Updates

```javascript
const ShoppingCart = (props, { getState, meta }) => {
	const items = getState("cart.items", []);
	const total = getState("cart.total", 0);

	// Title updates in real-time as cart changes
	if (items.length > 0) {
		meta.setTitle("Shopping Cart", [
			`${items.length} items`,
			`$${total.toFixed(2)}`,
		]);
	} else {
		meta.setTitle("Shopping Cart", ["Empty"]);
	}

	return {
		div: {
			className: "shopping-cart",
			children: [
				{ h1: { text: "Shopping Cart" } },
				{
					div: {
						className: "cart-summary",
						text: () => {
							const items = getState("cart.items", []);
							return items.length > 0
								? `${items.length} items - $${getState("cart.total", 0).toFixed(
										2
								  )}`
								: "Your cart is empty";
						},
					},
				},
				{
					div: {
						className: "cart-items",
						children: () =>
							getState("cart.items", []).map((item) => ({
								div: {
									className: "cart-item",
									children: [
										{ span: { text: item.name } },
										{ span: { text: `$${item.price}` } },
									],
								},
							})),
					},
				},
			],
		},
	};
};
```

### Blog Post with Rich Article Meta

```javascript
const BlogPost = (props, { getState, meta }) => {
	const post = getState("blog.currentPost");
	const author = getState("blog.author");
	const category = getState("blog.category");

	if (post) {
		// Hierarchical blog title
		meta.setTitle("Blog", [category?.name, post.title]);

		// Rich article meta
		meta.setMeta({
			description: post.excerpt,
			"og:type": "article",
			"og:title": post.title,
			"og:description": post.excerpt,
			"og:image": post.featured_image,
			"og:url": `https://mysite.com/blog/${post.slug}`,
			"article:author": author?.name,
			"article:published_time": post.published_at,
			"article:modified_time": post.updated_at,
			"article:section": category?.name,
			"article:tag": post.tags?.join(","),
		});
	}

	return {
		article: {
			className: "blog-post",
			children: [
				{
					header: {
						className: "post-header",
						children: [
							{
								h1: {
									text: () => getState("blog.currentPost.title", "Loading..."),
								},
							},
							{
								div: {
									className: "post-meta",
									children: [
										{
											span: {
												text: () =>
													`By ${getState("blog.author.name", "Unknown")}`,
											},
										},
										{
											span: {
												text: () =>
													getState("blog.currentPost.published_at", ""),
											},
										},
									],
								},
							},
						],
					},
				},
				{
					div: {
						className: "post-content",
						innerHTML: () => getState("blog.currentPost.content", ""),
					},
				},
			],
		},
	};
};
```

### Navigation-Based Title Building

```javascript
const BreadcrumbMeta = (props, { getState, meta }) => {
	const breadcrumbs = getState("navigation.breadcrumbs", []);

	if (breadcrumbs.length > 0) {
		const [main, ...segments] = breadcrumbs.map((crumb) => crumb.title);
		meta.setTitle(main, segments);
	}

	return {
		nav: {
			className: "breadcrumbs",
			children: () =>
				getState("navigation.breadcrumbs", []).map((crumb, index) => ({
					span: {
						className: "breadcrumb-item",
						children: [
							{ a: { href: crumb.url, text: crumb.title } },
							...(index < breadcrumbs.length - 1
								? [{ span: { text: " > " } }]
								: []),
						],
					},
				})),
		},
	};
};
```

## SSR Integration

### Express.js with Environment Detection

```javascript
const express = require("express");
const { Juris } = require("juris");
const { MetaManager } = require("./meta-manager");

const app = express();

app.get("*", async (req, res) => {
	// Create Juris instance with SSR context
	const juris = new Juris({
		headlessComponents: {
			meta: {
				fn: MetaManager,
				options: {
					autoInit: true,
					titleSeparator: " | ",
					defaults: {
						"og:site_name": "My Site",
						"twitter:site": "@mysite",
					},
				},
			},
		},
		states: await getInitialState(req),
		layout: MyApp,
	});

	// Render application (isSSR = true in context)
	const appHTML = await renderToString(juris);

	// Get meta HTML from headless component (non-blocking)
	const metaAPI = juris.headlessManager.getAPI("meta");
	const metaHTML = await metaAPI.getHTML();

	// Get serialized meta for client hydration
	const metaData = await metaAPI.serialize();

	res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            ${metaHTML}
        </head>
        <body>
            <div id="app">${appHTML}</div>
            <script>
                window.__INITIAL_STATE__ = ${JSON.stringify(
									juris.stateManager.state
								)};
                window.__META_DATA__ = ${JSON.stringify(metaData)};
            </script>
        </body>
        </html>
    `);
});
```

### Client-Side Hydration

```javascript
// client.js - Hydrate with meta data
const juris = new Juris({
	headlessComponents: {
		meta: { fn: MetaManager, options: { autoInit: true } },
	},
	states: window.__INITIAL_STATE__,
	layout: MyApp,
});

// Restore meta state from SSR (non-blocking)
if (window.__META_DATA__) {
	const metaAPI = juris.headlessManager.getAPI("meta");
	await metaAPI.deserialize(window.__META_DATA__);
}

// Render (isSSR = false in context, DOM updates will be immediate)
juris.render("#app");
```

### Next.js Integration

```javascript
// pages/_app.js
import { useEffect } from "react";
import { Juris } from "juris";
import { MetaManager } from "../components/MetaManager";

function MyApp({ Component, pageProps }) {
	useEffect(() => {
		const juris = new Juris({
			headlessComponents: {
				meta: { fn: MetaManager, options: { autoInit: true } },
			},
		});

		// Meta updates will happen in real-time (non-blocking)
		window.juris = juris;
	}, []);

	return <Component {...pageProps} />;
}
```

## Meta Tag Types

MetaManager automatically handles different meta tag formats:

### Standard Meta Tags

```javascript
meta.set("description", "Page description");
// Outputs: <meta name="description" content="Page description">

meta.set("viewport", "width=device-width, initial-scale=1");
// Outputs: <meta name="viewport" content="width=device-width, initial-scale=1">
```

### Title Tags

```javascript
meta.set("title", "Page Title");
// Outputs: <title>Page Title</title>
```

### OpenGraph Properties

```javascript
meta.set("og:title", "Social Title");
// Outputs: <meta property="og:title" content="Social Title">

meta.set("og:image", "https://example.com/image.jpg");
// Outputs: <meta property="og:image" content="https://example.com/image.jpg">
```

### Twitter Card Properties

```javascript
meta.set("twitter:card", "summary_large_image");
// Outputs: <meta property="twitter:card" content="summary_large_image">

meta.set("twitter:title", "Twitter Title");
// Outputs: <meta property="twitter:title" content="Twitter Title">
```

### Custom Meta Tags

```javascript
meta.set("custom-meta", {
	name: "custom",
	content: "value",
	"data-test": "true",
});
// Outputs: <meta name="custom" content="value" data-test="true">
```

## Title Segment State Structure

MetaManager stores title data in the Juris state system for reactivity:

```javascript
// State structure
{
    ui: {
        title: {
            main: "Products",           // Main title
            segment1: "Electronics",    // First segment
            segment2: "Laptops",       // Second segment
            segment3: "MacBook Pro"     // Third segment
            // ... up to segment10 supported
        }
    }
}

// Resulting title: "Products | Electronics | Laptops | MacBook Pro"
```

### Reactive Title Updates

Title automatically rebuilds when any segment changes:

```javascript
// Component sets initial title
meta.setTitle("Store", ["Electronics"]);

// Later, state change triggers title update
setState("ui.title.segment2", "Smartphones");
// Title becomes: "Store | Electronics | Smartphones"

// Adding via state also works
setState("ui.title.segment3", "iPhone");
// Title becomes: "Store | Electronics | Smartphones | iPhone"
```

## Performance

- **Memory Usage**: ~3KB base + 50-100 bytes per meta tag
- **SSR Overhead**: <1ms for typical meta collections
- **Client DOM Updates**: <1ms per meta tag injection (batched)
- **Title Reactivity**: <0.5ms for segment rebuilding
- **Build Size**: No additional bundle size
- **Operation Queue**: Max 5 DOM operations per tick for non-blocking behavior
- **Promise Tracking**: Integrates with Juris global promise system

## Environment Detection

MetaManager automatically adapts behavior based on the `isSSR` flag:

```javascript
const HomePage = (props, { meta, isSSR }) => {
    meta.setMeta({ title: 'Home Page' });

    if (isSSR) {
        // Server: Meta collected for HTML generation
        console.log(await meta.getHTML()); // Returns HTML string
    } else {
        // Client: document.title updated asynchronously
        console.log(document.title); // "Home Page" (after async update)
    }
};
```

## Best Practices

### 1. Set Defaults at Application Level

```javascript
const app = new Juris({
	headlessComponents: {
		meta: {
			fn: MetaManager,
			options: {
				autoInit: true,
				titleSeparator: " | ",
				defaults: {
					"og:site_name": "Your Site Name",
					"og:locale": "en_US",
					"twitter:site": "@yoursite",
					viewport: "width=device-width, initial-scale=1",
				},
			},
		},
	},
});
```

### 2. Use Hierarchical Titles

```javascript
const ProductPage = (props, { meta }) => {
	// Build meaningful title hierarchy (non-blocking)
	meta.setTitle("Store", ["Electronics", "Laptops", "MacBook Pro"]);
	// Result: "Store | Electronics | Laptops | MacBook Pro"
};
```

### 3. Leverage State-Driven Reactivity

```javascript
const SearchPage = (props, { getState, meta }) => {
	const query = getState("search.query");
	const results = getState("search.results", []);

	// Title updates automatically when state changes (non-blocking)
	if (query) {
		meta.setTitle("Search", [`"${query}"`, `${results.length} results`]);
	}
};
```

### 4. Use Async/Await for Complex Operations

```javascript
const ComplexPage = async (props, { meta }) => {
	// Sequential meta operations
	await meta.setTitle("Complex", ["Page"]);
	await meta.setMeta({ description: "Complex page description" });

	// Or parallel operations
	await Promise.all([
		meta.set("og:title", "Social Title"),
		meta.set("og:image", "image.jpg"),
		meta.addTitleSegment("Additional"),
	]);

	return { div: { text: "All meta operations completed" } };
};
```

### 5. Environment-Aware Logic

```javascript
const HomePage = (props, { meta, isSSR }) => {
	meta.setMeta({ title: "Home" });

	if (!isSSR) {
		// Client-only: Track meta changes (non-blocking)
		meta.getEnvironment().then((env) => {
			console.log(`Queue size: ${env.queueSize}`);
		});
	}
};
```

### 6. Clean Up When Needed

```javascript
// Clear specific meta when navigating (non-blocking)
await meta.clear("og:image");

// Reset page-specific meta
const pageMeta = ["title", "description", "og:title"];
await Promise.all(pageMeta.map((key) => meta.clear(key)));

// Or use title segments for automatic cleanup
await meta.setTitle("New Page"); // Clears all segments
```

## Troubleshooting

### Meta Not Appearing in HTML (SSR)

- Ensure MetaManager is initialized with `autoInit: true`
- Check that `await meta.getHTML()` is called server-side only
- Verify meta is set before rendering completes

### Title Not Updating (Client)

- Check that state subscription is working: `await meta.getTitleSegments()`
- Verify `isSSR` is false in client context
- Ensure title segments are set correctly in state
- Monitor operation queue: `meta.getEnvironment().queueSize`

### DOM Performance Issues

- Monitor DOM cache size: `meta.getEnvironment().domCacheSize`
- Monitor operation queue size: `meta.getEnvironment().queueSize`
- Use `await meta.clear()` to remove unused meta tags
- Avoid setting meta in frequently re-rendering components

### Async Operations Not Completing

- Ensure proper await usage: `await meta.setTitle(...)`
- Check promise chains for unhandled rejections
- Use `startTracking()` and `onAllComplete()` for SSR timing
- Monitor with `meta.getEnvironment()` for debugging

### State Reactivity Not Working

- Ensure proper state path format: `ui.title.main`, `ui.title.segment1`
- Check if component has access to `setState` in context
- Verify state subscriptions with `subscribe` method

## License

MIT License - Free to use in any project.

## Contributing

This is a standalone component for Juris. Submit issues and improvements via the main Juris repository.
