import { Link, useNavigate } from 'react-router-dom';

function Home () {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/attendance');
        navigate('/about');
    };

    return (

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1>Welcome to the Home Page</h1>
            <p>This is the home page of our application. You can navigate to the Attendance and About pages using the button below.</p>
            <button onClick={handleClick}>Go to Attendance and About</button>
            <Link to="/about">
                <button style={{ marginTop: '10px' , cursor: 'pointer' }}>Go to About Page</button>
            </Link>
        </div>
    )
}

export default Home;