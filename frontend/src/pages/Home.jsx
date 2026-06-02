import PageLayout from "../components/PageLayout";
import ProductList from "../components/ProductList";
import Section from "../components/Section";
import ShopGuide from "../components/ShopGuide";

const Home = () => {
  return (
    <PageLayout>
      <Section />
      <ShopGuide />
      <ProductList title="Featured products" />
    </PageLayout>
  );
};

export default Home;
