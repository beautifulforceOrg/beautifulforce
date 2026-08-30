import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Image, Text, TextInput, View } from "react-native";
import { Button, ProductGrid, formatPrice, useTheme } from "@storeforge/ui-native";
import type { ProductDetail } from "@storeforge/api-client";
import { Screen } from "../../components/screen";
import { apiClient } from "../../lib/api-client";
import { useCart } from "../../lib/cart-context";

export default function ProductDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const cart = useCart();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getProduct(slug)
      .then((fetched) => {
        if (cancelled) return;
        setProduct(fetched);
        setWishlisted(fetched.wishlisted);
        setSelectedVariantId(fetched.variants[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return <Text style={{ color: theme.colorForeground, padding: 16 }}>Product not found.</Text>;
  }
  if (!product) {
    return <ActivityIndicator color={theme.colorBrand} style={{ marginTop: 32 }} />;
  }

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const outOfStock = selectedVariant ? !selectedVariant.inStock : !product.inStock;
  const textStyle = { color: theme.colorForeground, fontFamily: theme.fontSans };

  async function handleAddToCart() {
    cart.addItem({
      productId: product!.id,
      name: product!.name,
      price: selectedVariant?.price ?? product!.price,
    });
    setMessage("Added to cart.");
  }

  async function handleToggleWishlist() {
    try {
      const result = await apiClient.toggleWishlist(product!.id);
      setWishlisted(result.wishlisted);
    } catch {
      setMessage("Log in to save items to your wishlist.");
    }
  }

  async function handleSubmitReview() {
    setReviewError(null);
    try {
      await apiClient.submitReview(slug, rating, comment);
      const refreshed = await apiClient.getProduct(slug);
      setProduct(refreshed);
      setComment("");
      setRating(0);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Please log in to leave a review.");
    }
  }

  return (
    <Screen>
      {product.images[0] ? <Image source={{ uri: product.images[0] }} style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 8 }} /> : null}
      <Text style={[textStyle, { fontSize: 20, fontWeight: "700" }]}>{product.name}</Text>
      <Text style={textStyle}>{formatPrice(selectedVariant?.price ?? product.price)}</Text>

      {product.variants.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {product.variants.map((variant) => (
            <Button
              key={variant.id}
              label={variant.value}
              variant={variant.id === selectedVariantId ? "solid" : "outline"}
              disabled={!variant.inStock}
              onPress={() => setSelectedVariantId(variant.id)}
            />
          ))}
        </View>
      ) : null}
      {outOfStock ? <Text style={{ color: "#B91C1C" }}>Sold out in this size</Text> : null}

      <Button label="Add to cart" onPress={handleAddToCart} disabled={outOfStock} />
      <Button label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} variant="outline" onPress={handleToggleWishlist} />
      {message ? <Text style={textStyle}>{message}</Text> : null}

      {product.description ? <Text style={textStyle}>{stripHtml(product.description)}</Text> : null}

      {product.completeTheLook ? (
        <>
          <Text style={[textStyle, { fontWeight: "700" }]}>Complete the Look</Text>
          <ProductGrid
            numColumns={1}
            products={[product.completeTheLook]}
            onSelectProduct={() => router.push(`/products/${product.completeTheLook!.slug}`)}
          />
        </>
      ) : null}

      {product.youMayAlsoLike.length > 0 ? (
        <>
          <Text style={[textStyle, { fontWeight: "700" }]}>You May Also Like</Text>
          <ProductGrid
            products={product.youMayAlsoLike}
            onSelectProduct={(id) => {
              const related = product.youMayAlsoLike.find((item) => item.id === id);
              if (related) router.push(`/products/${related.slug}`);
            }}
          />
        </>
      ) : null}

      <Text style={[textStyle, { fontWeight: "700" }]}>
        {product.ratingSummary.count > 0
          ? `${product.ratingSummary.average} out of 5 (${product.ratingSummary.count} review${product.ratingSummary.count === 1 ? "" : "s"})`
          : "Be the first to write a review"}
      </Text>
      {product.reviews.map((review) => (
        <View key={review.id} style={{ gap: 2 }}>
          <Text style={textStyle}>
            {review.rating} out of 5 -- {review.customerName ?? "Verified customer"}
          </Text>
          <Text style={textStyle}>{review.comment}</Text>
        </View>
      ))}

      {!product.hasReviewedAlready ? (
        <>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Button key={value} label={String(value)} variant={rating === value ? "solid" : "outline"} onPress={() => setRating(value)} />
            ))}
          </View>
          <TextInput
            placeholder="Share your experience with this product"
            multiline
            value={comment}
            onChangeText={setComment}
            style={{ borderWidth: 1, borderColor: theme.colorBorder, color: theme.colorForeground, borderRadius: 8, padding: 12, minHeight: 80 }}
          />
          {reviewError ? <Text style={{ color: "#B91C1C" }}>{reviewError}</Text> : null}
          <Button label="Submit review" onPress={handleSubmitReview} />
        </>
      ) : (
        <Text style={textStyle}>You&apos;ve reviewed this product. Thank you!</Text>
      )}
    </Screen>
  );
}

// product.description is trusted first-party HTML from the catalog
// import (same source the web app renders via dangerouslySetInnerHTML) --
// RN has no HTML renderer here, so this is a plain-text approximation,
// not a full port of the web's rich formatting.
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
