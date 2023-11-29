const activityButtons = document.querySelectorAll(".activity-item");

activityButtons.forEach( button => {
    button.addEventListener( "click", () => {
        activityButtons.forEach( b => {
            b.classList.toggle("item-selected", b === button);
        })
    })
})
