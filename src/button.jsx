function Button() {

    const clickCorrect = (e1) => e1.target.textContent = "CORRECT";
    const clickIncorrect = (e2) => e2.target.textContent = "INCORRECT";
    const clickUnsure = (e3) => e3.target.textContent = "???";

    return(
        <>
        <button className="buttonScam" onClick={(e1) => clickCorrect(e1)}>Scam </button>
        <button className="buttonNotScam" onClick={(e2) => clickIncorrect(e2)}>Safe</button>
        <div></div>
        <button className="buttonScam" onClick={(e1) => clickIncorrect(e1)}>Scam </button>
        <button className="buttonNotScam" onClick={(e2) => clickCorrect(e2)}>Safe</button>
        <div></div>
        <button className="buttonUnsure" onClick={(e3) => clickUnsure(e3)}> Unsure </button>
        </>
    );
}

export default Button
 