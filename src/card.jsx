import pic from './assets/screenshot.png'

function Card(){
    return(
        <>
        <div className ="card">
            <img className = "card-image" src= {pic} alt="Image of Ethan"></img>
            <h2 className = "card-title"> Ethan Calby</h2>
            <p className='card-text'>UI/UX designer</p>
        </div>
        <div className ="card">
            <img className = "card-image" src= {pic} alt="Image of Jiahao"></img>
            <h2 className = "card-title"> Jiaho Liu</h2>
            <p className='card-text'>Cybersecurity Logic</p>
        </div>
        <div className ="card">
            <img className = "card-image" src= {pic} alt="Image of Jiahao"></img>
            <h2 className = "card-title"> Alex Liu </h2>
            <p className='card-text'>Backend And Databases</p>
        </div>
        <div className ="card">
            <img className = "card-image" src= {pic} alt="Image of Jiahao"></img>
            <h2 className = "card-title"> Jason He </h2>
            <p className='card-text'>Gamification Systems</p>
        </div>
        </>
    )

}

export default Card