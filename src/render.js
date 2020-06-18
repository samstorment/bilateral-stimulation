const { remote } = require('electron');

let sidebar = document.querySelector('#sidebar');
sidebar.style.display = 'none';

let titlebar = document.querySelector('#title-bar');

let backgroundColor = document.querySelector('#background-color');
let ballColor = document.querySelector('#ball-color');
let ballSize = document.querySelector('#ball-size');
let ballSpeed = document.querySelector('#ball-speed');
let ballWait = document.querySelector('#ball-wait');

let soundCheckbox = document.querySelector('#sound-checkbox');
let defaultSoundCheckbox = document.querySelector('#default-sound-checkbox');
let soundFile = document.querySelector('#sound-file');
let chosenSound = document.querySelector('#chosen-sound');

let soundPicked = false;  // the sound selected from the file chooser
let sidebarOpen = false;
let right = true;
let left = false;
let fullScreen = false;

let canvas = document.querySelector('#canvas');
let context = canvas.getContext('2d');

setCanvasSize(0, -30);  // offset -30 for topbar


let circleX = canvas.width/2;

// draw the initial circle
drawCircle(circleX, canvas.height/2, parseInt(ballSize.value), ballColor.value);


let freeze = false;

// handles all the ball moving logic
function animate() {

    // keeps callign animate in a loop
    requestAnimationFrame(animate);
    if (freeze) { return; } // freeze is true until the timeout ends

    context.clearRect(0, 0, canvas.width, canvas.height);

    // if the ball is past the canvas to the left
    if (circleX <= 0 + parseInt(ballSize.value)) { 
        // draw the circle perfectly on the left isde of the canvas
        drawCircle(0 + ballSize.value, canvas.height/2, parseInt(ballSize.value), ballColor.value);
        // freeze the ball for the wait time
        freeze = true;
        setTimeout(() => { freeze = false; }, ballWait.value * 1000);
        // once we reach the left, we now need to move right
        right = true; 
        left = false;
        if (soundCheckbox.checked && defaultSoundCheckbox.checked) {
            document.getElementById('default-sound').play();
        }
        else if (soundCheckbox.checked && soundPicked) {
            chosenSound.play();
        }
    }

    // if the ball is past te canvas to the right
    else if (circleX >= canvas.width - parseInt(ballSize.value)) { 
        drawCircle(canvas.width - ballSize.value, canvas.height/2, parseInt(ballSize.value), ballColor.value);
        freeze = true;
        setTimeout(() => { freeze = false; }, ballWait.value * 1000);
        left = true; 
        right = false;
        if (soundCheckbox.checked && defaultSoundCheckbox.checked) {
            document.getElementById('default-sound').play();
        }
        else if (soundCheckbox.checked && soundPicked) {
            chosenSound.play();
        }
    }

    // for drawing when we arent at the edge of the screen
    else {
        drawCircle(circleX, canvas.height/2, parseInt(ballSize.value), ballColor.value);
    }
    
    // if we need to move right add to the x position, if left subtract from the x position
    if (right) { circleX+= parseInt(ballSpeed.value); }
    if (left)  { circleX-= parseInt(ballSpeed.value); }

}

// call the function above, this is basically looping now
animate();

window.addEventListener('resize', resize);

// we reset circleX here to prevent some weird behavior with the circle sticking to the side of the screen
function resize() {
    circleX = canvas.width/4;

    // if full screen, we dont need to accomodate for sidebar or titlebar pixels
    if (fullScreen) { setCanvasSize(0, 0); }
    // if sidebar is open, accomadate sidebar and topbar since we can never open sidebar in fullscreen
    else if (sidebarOpen) { setCanvasSize(-200, -30); }
    // otherwise just accomodate sidebar height
    else { setCanvasSize(0, -30); }
}

// draw a circle to our 2d context
function drawCircle(x, y, radius, color) {
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
}

// set canvas size to the windows innerheight and account for offsets based on sidebar/titlebar being open
function setCanvasSize(xOffset, yOffset) {
    canvas.width = window.innerWidth + xOffset;
    canvas.height = window.innerHeight + yOffset;
}

// change the background color to the input color
let body = document.querySelector('body');
backgroundColor.addEventListener('input', () => {
    body.style.background = backgroundColor.value;
});

// handle full screen
document.addEventListener("keyup", event => {
    let  keyCode = event.keyCode;

    if (keyCode === 122) { // f11
        fullScreen = !fullScreen;
        if (fullScreen) { 
            titlebar.style.display = 'none';
            sidebar.style.display = 'none';
            sidebarOpen = false;
        } 
        else { 
            titlebar.style.display = 'flex'; 
        }
        resize();
    }
});

// Listen for arrow keys to change ball speed and size
document.addEventListener("keydown", event => {
    let  keyCode = event.keyCode;

    if (keyCode === 38) { ballSize.value++; } // up arrow
    if (keyCode === 40) { ballSize.value--; } // down arrow
    if (keyCode === 37) { ballSpeed.value--; } // left arrow
    if (keyCode === 39) { ballSpeed.value++; } // right arrow
});

// button in the top left corner
let hamburgerMenu = document.querySelector('#hamburger-menu');
hamburgerMenu.addEventListener('click', () => {
    
    if (sidebar.style.display === 'none') {
        sidebarOpen = true;
        sidebar.style.display = 'block';
        resize();
    } else {
        sidebarOpen = false;
        sidebar.style.display = 'none';
        resize();
    }
});

// minimize the window when this is clicked
let minButton = document.querySelector('#min-button');
minButton.addEventListener('click', () => {
    remote.getCurrentWindow().minimize();
});

// Minimize/maximize button right next to the X button
let maxButton = document.querySelector('#max-button');
maxButton.addEventListener('click', () => {
    const currentWindow = remote.getCurrentWindow();
    currentWindow.isMaximized() ? currentWindow.unmaximize() : currentWindow.maximize();
});

// close the application when we click the x in the top right
let closeButton = document.querySelector('#close-button');
closeButton.addEventListener('click', () => {
    remote.app.quit();
});

// disable the file chooser depending on this checkbox
defaultSoundCheckbox.addEventListener('click', () => {
    if (defaultSoundCheckbox.checked) {
        soundFile.disabled = true;
    } else {
        soundFile.disabled = false;
    }
}); 

// when we choose a new file to upload
soundFile.onchange = event => {

    // get the uploaded file
    let files = event.target.files;
    if (files.length > 0) {
        soundPicked = true;
        // set the source of the chosenSound audio element
        chosenSound.setAttribute('src', URL.createObjectURL(files[0]));
        chosenSound.load();
    } else {
        soundPicked = false;
    }
};



