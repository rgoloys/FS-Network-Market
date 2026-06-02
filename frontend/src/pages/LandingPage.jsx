import PageLayout from "../components/PageLayout";
import ProductList from "../components/ProductList";
import Section from "../components/Section";
import ShopGuide from "../components/ShopGuide";

const LandingPage = () => {
  return (
    <PageLayout>
      <Section
        primaryCta={{ label: "Create account", to: "/register" }}
        secondaryCta={{ label: "Log in", to: "/login" }}
      />
      <ShopGuide />
      <ProductList />
    </PageLayout>
  );
};

export default LandingPage;
