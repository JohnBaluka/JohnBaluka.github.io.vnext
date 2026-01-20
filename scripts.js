Reveal.initialize({
    controls: true,
    progress: true,
    hash: true,
    width: "1280",
    height: "800",
    showNotes: true,
    slideNumber: "c/t",
    //fragments: false,
    //autoAnimate: false,
    mouseWheel: true,
    //view: 'scroll',
    //scrollProgress: true,
    //controlsLayout: 'edges',
    keyboard: true,

    menu: {
        themes: false,
        transitions: false,
        markers: true,
        hideMissingTitles: false,
        custom: [
            {
                title: 'Images',
                icon: '<i class="fa fa-images">',
                src: 'thumbs.htm'
            },
        ],
    },

    customcontrols: {
        controls: [
            {
                id: 'toggle-fragments',
                title: 'Toggle Animations',
                icon: '<i class="fa toggle-icon fa-toggle-off"></i>',
                action: 'toggleFragments();',
            },
        ]
    },

    // simplemenu: {
    //     barhtml: {
    //         header: "<div class='menubar'><ul class='menu'></ul><div>",
    //         footer: ""
    //     }
    // },

    audio: {
        prefix: 'audio/', 	// audio files are stored in the "audio" folder
        suffix: '.mp3',  	// audio files have the ".webm" ending
        textToSpeechURL: null,  // the URL to the text to speech converter
        defaultNotes: false, 	// use slide notes as default for the text to speech converter
        defaultText: false, 	// use slide text as default for the text to speech converter
        advance: -1, 		// advance to next slide after given time in milliseconds after audio has played, use negative value to not advance
        autoplay: false,	// automatically start slideshow
        defaultDuration: 5,	// default duration in seconds if no audio is available
        defaultAudios: true,	// try to play audios with names such as audio/1.2.webm
        defaultPlaybackRate: 1.0, // speed of audio
        playerOpacity: 1,	// opacity value of audio player if unfocused
        playerStyle: 'position: fixed; bottom: 4px; left: 25%; width: 30%; height:75px; z-index: 33;', // style used for container of audio controls
        startAtFragment: false, // when moving to a slide, start at the current fragment or at the start of the slide
    },

    plugins: [
        RevealZoom,
        RevealNotes,
        RevealSearch,
        RevealHighlight,
        RevealMenu,
        RevealCustomControls,
        RevealAudioSlideshow,
    ]
});

function toggleFragments() {
    const fragmentsOff = document.querySelectorAll('.fragment-off');
    
    const toggleFragmentsButton = document.getElementById('toggle-fragments').children[0].children[0];
    
    if (fragmentsOff.length > 0)
    {
        enableFragments();
        toggleFragmentsButton.classList.remove('fa-toggle-off');
        toggleFragmentsButton.classList.add('fa-toggle-on');
    }
    else
    {
        disableFragments();
        toggleFragmentsButton.classList.remove('fa-toggle-on');
        toggleFragmentsButton.classList.add('fa-toggle-off');
    }
}

function disableFragments() {
    const fragments = document.querySelectorAll('.fragment');
    console.debug( "disableFragments " + fragments.length);
    fragments.forEach(fragment => {
        fragment.classList.remove('fragment');
        fragment.classList.add('fragment-off');
    });
}

function enableFragments() {
    const fragments = document.querySelectorAll('.fragment-off');
    console.debug( "enableFragments " + fragments.length);
    fragments.forEach(fragment => {
        fragment.classList.remove('fragment-off');
        fragment.classList.add('fragment');
    });
}

function toggleFragmentsOnSlide() {
    let currentSlide = Reveal.getCurrentSlide();
    let currentSlideId = currentSlide.getAttribute("id");
    
    const fragmentsOff = document.querySelectorAll('[id*="--' + currentSlideId + '--"].fragment-off');

    if (fragmentsOff.length > 0)
    {
        enableFragmentsOnSlide(currentSlideId, true);
    }
    else
    {
        disableFragmentsOnSlide(currentSlideId, true);
    }
}

function disableFragmentsOnSlide(slideName, toggleButton) {
    const toggleFragmentsButton = document.getElementById('toggle-fragments').children[0].children[0];
    const fragments = document.querySelectorAll('[id*="--' + slideName + '--"].fragment');
    console.debug( "disableFragments " + fragments.length + " on " + slideName);
    
    if (toggleButton)
    {
        toggleFragmentsButton.classList.remove('fa-toggle-on');
        toggleFragmentsButton.classList.add('fa-toggle-off');
    }

    if (fragments.length > 0)
    {
        fragments.forEach(fragment => {
            //console.debug('id: ' + fragment.id);
            fragment.classList.remove('fragment');
            fragment.classList.add('fragment-off');
        });
    }
}

function enableFragmentsOnSlide(slideName, toggleButton) {
    const toggleFragmentsButton = document.getElementById('toggle-fragments').children[0].children[0];
    const fragmentsOff = document.querySelectorAll('[id*="--' + slideName + '--"].fragment-off');
    console.debug( "enableFragments " + fragmentsOff.length + " on " + slideName);

    if (toggleButton)
    {
        toggleFragmentsButton.classList.remove('fa-toggle-off');
        toggleFragmentsButton.classList.add('fa-toggle-on');
    }

    if (fragmentsOff.length > 0)
    {
        fragmentsOff.forEach(fragment => {
            //console.debug('id: ' + fragment.id);
            fragment.classList.remove('fragment-off');
            fragment.classList.add('fragment');
        });
    }
}

function getAudioPlayerNameOnSlide(slideName)
{
    //console.debug( "getAudioPlayerNameOnSlide " + slideName);
    let slideNumber = Number(slideName.replace("slide", ""))
    let slideIndex = slideNumber - 1;

    let audioPlayerName = "audioplayer-" + slideIndex + ".0";

    return audioPlayerName;
}

function getSlideNumberFromAudioPlayerName(audioPlayerName)
{
    //console.debug( "getSlideNumberFromAudioPlayerName " + audioPlayerName);
    let audioPlayerNameRemovedSuffix = audioPlayerName.replace(".0", "");
    let audioPlayerNameRemovedPrefix = audioPlayerNameRemovedSuffix.replace("audioplayer-", "");
    let slideNumber = Number(audioPlayerNameRemovedPrefix) + 1;

    return Number(slideNumber);
}

function resetSlideAudio(slideName, time)
{
    console.debug( "resetSlideAudio " + slideName + " " + time);

    let audioPlayerName = getAudioPlayerNameOnSlide(slideName);
    const audioPlayerForSlide = document.getElementById(audioPlayerName);

    audioPlayerForSlide.currentTime = time;
}

function applyLineEventListners()
{
    const lines = document.querySelectorAll(".line")

    lines.forEach(function(lineCurrent) {
        const color = window.getComputedStyle(lineCurrent).getPropertyValue('background-color'); //grabs the css background color
        lineCurrent.addEventListener('mouseover', function(e) {
            //console.debug( "mouseover ");
            e.target.style.backgroundColor = 'white';
            e.target.style.border = `1px solid ${color}`;
        });

        lineCurrent.addEventListener('mouseleave', function(e) {
            //console.debug( "mouseleave ");
            e.target.style.backgroundColor = color;
            e.target.style.border = '1px solid white'; //could do this so adding the border doesnt jump the box 
        });
    });
}

let isPlaying = false;

function SetIsPlaying(value)
{
    isPlaying = value;
    console.debug("SetIsPlaying - " + isPlaying);
}

// Select the node that will be observed for mutations
const targetNode = document.getElementById("rootReveal");

// Options for the observer (which mutations to observe)
const config = { childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
        mutation.addedNodes.forEach(item => {
            if (item.id && item.id.startsWith("audio")) {
                item.addEventListener('timeupdate', event => {
                    let media = event.target;
                    let slideNumber = getSlideNumberFromAudioPlayerName(media.getAttribute("id"));
                    let slideId = "slide" + slideNumber;

                    let now = media.currentTime;
                    let speakerNotes = document.getElementsByClassName("speaker-notes")[0];

                    let linesQuery = "span[data-section='" + slideId + "'][data-type='narration']";
                    let lines = speakerNotes.querySelectorAll(linesQuery);

                    //console.debug("timeupdate - " + lines.length + " - " + linesQuery);

                    //console.debug("timeupdate - " + now);

                    // highlight text as audio plays
                    for (var i = 0, l = lines.length; i < l; i++) {
                        let start = Number(lines[i].getAttribute("data-start"));
                        let end = Number(lines[i].getAttribute("data-end"));
                        let lineId = lines[i].getAttribute("id");
                        let dataSection = lines[i].getAttribute("data-section");

                        if (now >= start &&
                            now <= end)
                        {
                            //console.debug("timeupdate - " + lineId + " - add " + start + " =< " + now + " >= " + end);

                            lines[i].classList.add("currentLine");
                            if (i===0) {
                                Reveal.navigateFragment(-1);
                            } else {
                                Reveal.navigateFragment(i-1);
                            }
                        } else {
                            //console.debug( "timeupdate " + lineId + " - remove " + start + " =< " + now + " >= " + end);
                            lines[i].classList.remove("currentLine");
                        }
                    }
                });
                item.addEventListener('play', event => {
                    SetIsPlaying(true);

                    let speakerNotes = document.getElementsByClassName("speaker-notes:before");

                    console.debug( "play " + speakerNotes);

                    let currentSlide = Reveal.getCurrentSlide();
                    let currentSlideId = currentSlide.getAttribute("id");

                    enableFragmentsOnSlide(currentSlideId, true);
                });
                item.addEventListener('pause', event => {
                    SetIsPlaying(false);

                    let speakerNotes = document.getElementsByClassName("speaker-notes:before");

                    console.debug( "pause " + speakerNotes);
                });
                item.addEventListener('ended', event => {
                    let speakerNotes = document.getElementsByClassName("speaker-notes:before");

                    let currentSlide = Reveal.getCurrentSlide();
                    let currentSlideId = currentSlide.getAttribute("id");

                    console.debug( "ended " + speakerNotes);

                    SetIsPlaying(true);

                    disableFragmentsOnSlide(currentSlideId, true);

                    Reveal.next();
                });
                item.addEventListener('loadeddata', event => {
                    let speakerNotes = document.getElementsByClassName("speaker-notes:before");

                    console.debug( "loadeddata " + speakerNotes);
                });
            }

            if (item.classList && item.classList.contains("line")) {
                const color = window.getComputedStyle(item).getPropertyValue('background-color'); //grabs the css background color
                item.addEventListener('mouseover', function(e) {
                    //console.debug( "mouseover ");
                    if (e.target.classList.contains("currentLine")) return;

                    if (e.target.classList.contains("mouseOverLine")) return;
                    if (e.target.classList.contains("mouseLeaveLine")) e.target.classList.remove("mouseLeaveLine");
                    e.target.classList.add("mouseOverLine");
                });
        
                item.addEventListener('mouseleave', function(e) {
                    //console.debug( "mouseleave ");
                    if (e.target.classList.contains("currentLine")) return;
                    
                    if (e.target.classList.contains("mouseLeaveLine")) return;
                    if (e.target.classList.contains("mouseOverLine")) e.target.classList.remove("mouseOverLine");
                    e.target.classList.add("mouseLeaveLine");
                    
                });

                item.addEventListener('click', function(e) {
                    console.debug( "click ");

                    if (e.target.classList.contains("currentLine")) return;

                    if (e.target.classList.contains("mouseOverLine")) e.target.classList.remove("mouseOverLine");
                    if (e.target.classList.contains("mouseLeaveLine")) e.target.classList.remove("mouseLeaveLine");

                    const lines = document.querySelectorAll(".line")

                    lines.forEach(function(line) {
                        if (line.classList.contains("currentLine")) line.classList.remove("currentLine");
                    });

                    e.target.classList.add("currentLine");

                    let slideName = e.target.getAttribute("data-section");
                    let start = Number(e.target.getAttribute("data-start"));
                    const lineId = e.target.getAttribute("id");
                    const lineIdParts = lineId.split("l");
                    const lineNumber = Number(lineIdParts[1]);

                    enableFragmentsOnSlide(slideName, true);

                    let fragmentNumber = -1;
                    if (lineNumber <= 1)
                    {
                        Reveal.navigateFragment(fragmentNumber);
                        
                    }
                    else
                    {
                        fragmentNumber = lineNumber - 2;
                        Reveal.navigateFragment(fragmentNumber);
                    }

                    resetSlideAudio(slideName, start);
                });
            }
        })
    }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

Reveal.on('ready', (event) => {
    // event.currentSlide, event.indexh, event.indexv
    console.debug( "ready ");
});

Reveal.on( 'fragmentshown', function( event ) {
    // event.fragment = the fragment DOM element
    let fragmentId = event.fragment.getAttribute("id");

    console.debug( "fragmentshown " + fragmentId);
});

Reveal.on( 'fragmenthidden', function( event ) {
    // event.fragment = the fragment DOM element
    let fragmentId = event.fragment.getAttribute("id");

    console.debug( "fragmenthidden " + fragmentId);
});

Reveal.on('slidechanged', (event) => {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv

    let previousSlideId = "";
    if (event.previousSlide) previousSlideId = event.previousSlide.getAttribute("id");
    
    let currentSlideId = event.currentSlide.getAttribute("id");

    console.debug( "slidechanged " + currentSlideId + " (" + previousSlideId + ")");

    return;

    if (previousSlideId != "" && previousSlideId != currentSlideId)
    {
        disableFragmentsOnSlide(previousSlideId, false);
    }

    if (isPlaying)
    {
        enableFragmentsOnSlide(currentSlideId, true);
    }
    else
    {
        disableFragmentsOnSlide(currentSlideId, true);
    }
});

Reveal.on('slidetransitionend', (event) => {
    let currentSlideId = event.currentSlide.getAttribute("id");

    //console.log("slidetransitionend ");
    console.log("slidetransitionend " + currentSlideId);

    if (isPlaying)
    {
        let audioPlayerName = getAudioPlayerNameOnSlide(currentSlideId.toLowerCase());
        const audioPlayerForSlide = document.getElementById(audioPlayerName);
    
        audioPlayerForSlide.play();
    }
});

Reveal.on('resize', (event) => {
    // event.scale, event.oldScale, event.size
    console.log("resize ");
});

Reveal.on('overviewshown', (event) => {
    /* ... */
    console.debug( "overviewshown ");
});

Reveal.on('overviewhidden', (event) => {
    /* ... */
    console.debug( "overviewhidden ");
});
