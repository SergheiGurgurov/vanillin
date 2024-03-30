# Vanillin

a simple dev server with automatic ts/scss traspilation and page-reloading

## Installation

install the package globally

```bash
npm i -g vanillin
```

## Usage

### Launching Vanillin

run the package to serve the current directory

```bash
vanillin
## Server listening on http://localhost:8080
```

![warn] if port 8080 is busy another random free port will be selected

### Serving Ts/Scss files

vanillin will automatically transpile scss/ts file you import in your html

```html
<!-- the transpliled js will be provided for this resource -->
<script src="./scripts/example.ts"></script>
```

to avoid unnecessary computation, the files are saved into the **.vanillin-cache** folder
and are only transpiled again if the original ts has been modified
