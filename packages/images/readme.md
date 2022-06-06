# Images Worker

This worker uses [Cloudflare Image Resizing](https://developers.cloudflare.com/images/image-resizing/)

## URL

`https://images.web3.storage/<OPTIONS>/<SOURCE-IMAGE>`

Check options [here](https://developers.cloudflare.com/images/image-resizing/url-format/#options), not all options are implemented yet.

The source image can be an absolute URL or a relative URL with a valid `Referer` header.

## Supported options

- [format](https://developers.cloudflare.com/images/image-resizing/url-format/#format)
- [quality](https://developers.cloudflare.com/images/image-resizing/url-format/#quality)
- [width](https://developers.cloudflare.com/images/image-resizing/url-format/#width)
- [height](https://developers.cloudflare.com/images/image-resizing/url-format/#height)
- [fit](https://developers.cloudflare.com/images/image-resizing/url-format/#fit)

## Localhost

In development requests for image sources with a `localhost` hostname are just redirected to the original localhost source without any transformation.
