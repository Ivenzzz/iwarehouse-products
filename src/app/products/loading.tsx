export default function ProductsLoading() {
  return (
    <section className="catalog-page shell" aria-busy="true" aria-label="Loading products">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton skeleton-card" key={index} />
        ))}
      </div>
    </section>
  );
}
