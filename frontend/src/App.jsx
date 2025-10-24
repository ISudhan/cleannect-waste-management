import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import About from './components/About';
import Signup from './components/Signup';
import Signin from './components/Signin';
import ServicesAndSupport from './components/ServicesAndSupport';
import Hero from './components/Hero';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin/>} />
        <Route path="/services" element={<ServicesAndSupport/>} />
        <Route path="/hero" element={<Hero/>} />
       
      </Routes>
    </Router>
  );
}

export default App;