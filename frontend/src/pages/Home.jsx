import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>Transform Waste into Wealth</h1>
        <p>
          Connect with local waste collectors and buyers. Sell your recyclables, 
          find great deals, and contribute to a sustainable future with Cleannect.
        </p>
        <div className="hero-buttons">
          <Link to="/waste" className="btn btn-primary">
            Browse Waste Listings
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Join Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-3">
        <div className="card">
          <h2>🏠 For Households</h2>
          <p>
            Easily sell your recyclable waste to local collectors. 
            Get fair prices and contribute to environmental sustainability.
          </p>
        </div>
        
        <div className="card">
          <h2>♻️ For Collectors</h2>
          <p>
            Find quality waste materials from verified households. 
            Build your business and help create a circular economy.
          </p>
        </div>
        
        <div className="card">
          <h2>💰 For Buyers</h2>
          <p>
            Source recycled materials directly from collectors. 
            Support local businesses and reduce your carbon footprint.
          </p>
        </div>
      </section>

      {/* Dual Role Section */}
      <section className="card">
        <h2 className="text-center">🔄 Dual Role Users</h2>
        <p className="text-center mb-3">
          Many users choose to both buy and sell waste materials, creating a more dynamic marketplace.
        </p>
        <div className="grid grid-2">
          <div className="text-center">
            <h3>🛒 Buy Waste</h3>
            <p>Find materials you need for your business or projects</p>
          </div>
          <div className="text-center">
            <h3>💰 Sell Waste</h3>
            <p>Turn your recyclables into cash</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="card">
        <h2 className="text-center">How It Works</h2>
        <div className="grid grid-4">
          <div className="text-center">
            <div className="waste-image">1</div>
            <h3>Post</h3>
            <p>List your waste with photos and details</p>
          </div>
          
          <div className="text-center">
            <div className="waste-image">2</div>
            <h3>Connect</h3>
            <p>Get matched with local collectors</p>
          </div>
          
          <div className="text-center">
            <div className="waste-image">3</div>
            <h3>Deal</h3>
            <p>Negotiate prices and arrange pickup</p>
          </div>
          
          <div className="text-center">
            <div className="waste-image">4</div>
            <h3>Earn</h3>
            <p>Get paid and help the environment</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="card">
        <h2 className="text-center">Waste Categories</h2>
        <div className="grid grid-4">
          <div className="text-center">
            <div className="waste-image">🥤</div>
            <h3>Plastic</h3>
          </div>
          
          <div className="text-center">
            <div className="waste-image">📰</div>
            <h3>Paper</h3>
          </div>
          
          <div className="text-center">
            <div className="waste-image">🔧</div>
            <h3>Metal</h3>
          </div>
          
          <div className="text-center">
            <div className="waste-image">🍃</div>
            <h3>Organic</h3>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="card text-center">
        <h2>Ready to Start?</h2>
        <p className="mb-3">
          Join thousands of users already making money from waste and 
          contributing to a sustainable future.
        </p>
        <div className="d-flex justify-center gap-2">
          <Link to="/register" className="btn btn-success">
            Create Account
          </Link>
          <Link to="/waste" className="btn btn-primary">
            Explore Listings
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
