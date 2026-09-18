// About.jsx
import { Link } from 'react-router-dom';

function About() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>About Page</h2>
      <Link to="/">Go Back Home</Link>
    </div>
  );
}

export default About;
