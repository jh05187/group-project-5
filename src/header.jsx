import CaseFeed from "./caseFeed";

function Header(){
    return (
        <header>
            <h1>-- SCAMSHIELD HUB --</h1>
            <h2>Phishing Dectection Training Program</h2>
            <hr></hr>
            <nav>
                <ul>
                    <a href="https://google.com" target="_blank" rel="noopener noreferrer">Visit Google</a>

                    <li><a href="CaseFeed">Home / Case Feed</a></li>
                    <router>
                        <routes>
                            
                        </routes>
                    </router>
                    <li><a href="Login">Login / Register </a></li>
                    <li><a href="CaseDetail">Case Detail Page</a></li>
                    <li><a href="UserProfile">User Profile</a></li>
                    <li><a href="Leaderboard">Leaderboard</a></li>
                    <li><a href="AdminDashBoard">Admin Dashboard</a></li>
                </ul>
            </nav>
            <hr></hr>
            <h2>DEVELOPED BY: </h2>
        </header>
    );
}

export default Header