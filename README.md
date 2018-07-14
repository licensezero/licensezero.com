# licensezero.com

This is the source code for the HTTP server that provides [licensezero.com](https://licensezero.com) and the License Zero API.

## Architecture

licensezero.com is a single Node.js HTTP server application.  The server stores all persistent data on the file system within a single directory specified by an environment variable.  The server uses Stripe for payments and Mailgun for e-mail.

The API at `/api/v{version}` expects JSON request bodies, serves JSON response bodies, an always responds with status 200 in normal operation.  Response bodies may contain an `error` string property.

The [command-line interface](https://github.com/licensezero/cli) essentially wraps the API, and also uses licensezero.com to report the current available CLI version.

## License

Artless Devices LLC, the company behind [licensezero.com](https://licensezero.com), licenses this code under [Parity](./LICENSE) terms, without offering private licenses for use in closed source.
