# IQP Orders

Mobile-friendly order portal for International Quality Parts. Customers can search the WIX filter catalog, add quantities to a cart, enter company details, and save or print the completed order as a PDF. The site does not send email automatically.

## Catalog data

Place the WIX price-list rows in `data/products.csv` with these columns:

```csv
part_number,description,sell_price,image_url
```

`sell_price` is the customer-facing price. `image_url` is optional. CSV values containing commas should be enclosed in double quotes.

## Hosting

The project is a static Progressive Web App and can be hosted with GitHub Pages or any static web host. HTTPS enables offline caching and installation to a phone Home Screen.
