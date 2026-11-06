{!! '<'.'?xml version="1.0" encoding="UTF-8"?'.'>' !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach ($urls as $url)
@foreach ($url['alternates'] as $locale => $loc)
  <url>
    <loc>{{ $loc }}</loc>
@if ($url['lastmod'])
    <lastmod>{{ $url['lastmod'] }}</lastmod>
@endif
@foreach ($url['alternates'] as $altLocale => $altLoc)
    <xhtml:link rel="alternate" hreflang="{{ config('portfolio.hreflang')[$altLocale] ?? $altLocale }}" href="{{ $altLoc }}"/>
@endforeach
    <xhtml:link rel="alternate" hreflang="x-default" href="{{ $url['alternates'][config('portfolio.default_locale')] }}"/>
  </url>
@endforeach
@endforeach
</urlset>
