import Footer from "./Footer";
import Header from "./Header";

const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-[#141414]">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default PageLayout;
