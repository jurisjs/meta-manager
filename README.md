# Juris MetaManager

A lean, zero-bloat headless component for dynamic meta tag management in Juris applications with first-class SSR support.

## Features

- 🎯 **Zero Framework Bloat** - Pure headless component, no core modifications
- 🚀 **SSR Optimized** - HTML generation only runs server-side
- ⚡ **Memory Efficient** - Uses Map for O(1) operations
- 🔗 **Chainable API** - Fluent interface for better developer experience
- 🛡️ **XSS Protected** - Built-in HTML escaping
- 📱 **Smart Normalization** - Handles OpenGraph, Twitter Cards, and standard meta automatically

## Installation

Simply add the MetaManager component to your Juris application - no additional dependencies required.

## Quick Start

```javascript
// Initialize with site defaults
const app = new Juris({
	headlessComponents: {
		meta: {
			fn: MetaManager,
			options: {
				autoInit: true,
				defaults: {
					title: "My Awesome Site",
					description: "Default site description",
					"og:site_name": "My Awesome Site",
					"twitter:card": "summary_large_image",
				},
			},
		},
	},
});

// Use in components
const HomePage = (props, { components }) => {
	const meta = components.getHeadlessAPI("meta");

	meta.setMeta({
		title: "Welcome Home",
		"og:title": "Welcome to Our Site",
		"og:image": "https://mysite.com/home-og.jpg",
	});

	return { div: { text: "Welcome!" } };
};
```

## API Reference

### Core Methods

#### `set(key, value)`

Set a single meta tag.

```javascript
meta.set("title", "Page Title");
meta.set("og:title", "Social Title");
```

#### `setMeta(object)`

Set multiple meta tags at once.

```javascript
meta.setMeta({
	title: "Product Page",
	description: "Amazing product description",
	"og:title": "Buy This Product",
	"og:image": "https://example.com/product.jpg",
});
```

#### `get(key)`

Get a single meta tag value.

```javascript
const title = meta.get("title");
```

#### `getAll()`

Get all meta tags as an object.

```javascript
const allMeta = meta.getAll();
// { title: { title: 'Page Title' }, description: { name: 'description', content: '...' } }
```

#### `getHTML()`

Get all meta tags as HTML string (SSR only).

```javascript
const metaHTML = meta.getHTML();
// <title>Page Title</title>
// <meta name="description" content="...">
// <meta property="og:title" content="...">
```

### Specialized Getters

#### `getOpenGraph()`

Get only OpenGraph meta tags.

```javascript
const ogTags = meta.getOpenGraph();
// { 'og:title': 'Title', 'og:description': 'Desc' }
```

#### `getTwitterCard()`

Get only Twitter Card meta tags.

```javascript
const twitterTags = meta.getTwitterCard();
// { 'twitter:card': 'summary', 'twitter:title': 'Title' }
```

#### `getTitles()`

Get all title-related meta tags.

```javascript
const titles = meta.getTitles();
```

### Utility Methods

#### `update(object)`

Merge new meta with existing (non-destructive).

```javascript
meta.update({ "og:updated_time": new Date().toISOString() });
```

#### `clear(key)` / `reset()`

Remove specific meta or clear all.

```javascript
meta.clear("og:image"); // Remove specific
meta.reset(); // Clear all
```

#### `has(key)` / `count()`

Check existence and get count.

```javascript
if (meta.has("og:image")) {
	/* ... */
}
console.log(`${meta.count()} meta tags`);
```

#### `serialize()` / `deserialize(json)`

Export/import for hydration.

```javascript
const json = meta.serialize();
meta.deserialize(json);
```

## Usage Patterns

### Basic Page Meta

```javascript
const AboutPage = (props, { components }) => {
	const meta = components.getHeadlessAPI("meta");

	meta.setMeta({
		title: "About Us - Company Name",
		description: "Learn about our company history and mission",
		"og:title": "About Our Company",
		"og:description": "Learn about our company history and mission",
		"og:url": "https://company.com/about",
	});

	return {
		/* component JSX */
	};
};
```

### Dynamic Product Meta

```javascript
const ProductPage = (props, { getState, components }) => {
	const meta = components.getHeadlessAPI("meta");
	const product = getState("product.current");

	if (product) {
		meta.setMeta({
			title: `${product.name} - ${product.price}`,
			description: product.description,
			"og:title": product.name,
			"og:image": product.images[0],
			"og:price:amount": product.price,
			"og:price:currency": "USD",
			"product:brand": product.brand,
		});
	}

	return {
		/* component JSX */
	};
};
```

### Blog Article Meta

```javascript
const BlogPost = (props, { getState, components }) => {
	const meta = components.getHeadlessAPI("meta");
	const post = getState("blog.currentPost");
	const author = getState("blog.author");

	if (post) {
		meta.setMeta({
			title: `${post.title} | Blog`,
			description: post.excerpt,
			"og:type": "article",
			"og:title": post.title,
			"og:image": post.featured_image,
			"article:author": author?.name,
			"article:published_time": post.published_at,
			"article:section": post.category,
			"article:tag": post.tags?.join(","),
		});
	}

	return {
		/* component JSX */
	};
};
```

## SSR Integration

### Express.js Example

```javascript
const express = require("express");
const { Juris } = require("juris");
const { MetaManager } = require("./meta-manager");

const app = express();

app.get("*", async (req, res) => {
	// Create Juris instance
	const juris = new Juris({
		headlessComponents: {
			meta: {
				fn: MetaManager,
				options: {
					autoInit: true,
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

	// Render application
	const appHTML = await renderToString(juris);

	// Get meta HTML
	const metaAPI = juris.headlessManager.getAPI("meta");
	const metaHTML = metaAPI.getHTML();

	// Send complete HTML
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
            </script>
        </body>
        </html>
    `);
});
```

### Next.js Example

```javascript
// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html>
			<Head>{/* MetaManager HTML will be injected here */}</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

// pages/[...slug].js
export async function getServerSideProps({ params, req }) {
	const juris = new Juris({
		headlessComponents: {
			meta: { fn: MetaManager, options: { autoInit: true } },
		},
		states: await getPageData(params.slug),
		layout: MyApp,
	});

	const metaAPI = juris.headlessManager.getAPI("meta");

	return {
		props: {
			initialState: juris.stateManager.state,
			metaHTML: metaAPI.getHTML(),
		},
	};
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

## Performance

- **Memory Usage**: ~2KB base + 50-100 bytes per meta tag
- **SSR Overhead**: <1ms for typical meta collections
- **Client Impact**: Zero (no-op on client-side)
- **Build Size**: No additional bundle size

## Best Practices

### 1. Set Defaults at Application Level

```javascript
const app = new Juris({
	headlessComponents: {
		meta: {
			fn: MetaManager,
			options: {
				autoInit: true,
				defaults: {
					"og:site_name": "Your Site Name",
					"og:locale": "en_US",
					"twitter:site": "@yoursite",
				},
			},
		},
	},
});
```

### 2. Update Meta in Route Components

```javascript
const ProductPage = (props, { components }) => {
	const meta = components.getHeadlessAPI("meta");

	// Update page-specific meta
	meta.setMeta({
		title: `${product.name} - Buy Now`,
		"og:title": product.name,
		"og:image": product.image,
	});

	return {
		/* component */
	};
};
```

### 3. Use Conditional Meta

```javascript
const ConditionalMeta = (props, { getState, components }) => {
	const meta = components.getHeadlessAPI("meta");
	const user = getState("user.current");

	if (user) {
		meta.set("og:title", `${user.name}'s Profile`);
	} else {
		meta.set("og:title", "Sign In Required");
	}

	return {
		/* component */
	};
};
```

### 4. Clear Meta When Needed

```javascript
// Clear specific meta when navigating
meta.clear("og:image");

// Or reset all page-specific meta
const pageMeta = ["title", "description", "og:title", "og:description"];
pageMeta.forEach((key) => meta.clear(key));
```

## Troubleshooting

### Meta Not Appearing in HTML

- Ensure MetaManager is initialized with `autoInit: true`
- Check that `getHTML()` is called server-side only
- Verify meta is set before rendering completes

### Duplicate Meta Tags

- Use `meta.clear(key)` before setting new values
- Check for multiple MetaManager instances
- Ensure defaults don't conflict with page meta

### Performance Issues

- Use `meta.count()` to monitor meta tag quantity
- Clear unused meta with `meta.clear()` or `meta.reset()`
- Avoid setting meta in frequently re-rendering components

## License

MIT License - Free to use in any project.

## Contributing

This is a standalone component for Juris. Submit issues and improvements via the main Juris repository.
