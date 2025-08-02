Look at and study the `src/games/warbirds/` game to understand how to write a canvas-driven click-based lightgun-web shooter game.  

Study the asset images available under the folder `public/assets/fish/` to use as assets in building a game called zombiefish, where clicking(shooting) a fish randomly turns it into a bony skeleton that starts to chase other fish turning them into skeletons as well.  

Skeleton fish take 2 clicks(shots) to kill.  Use `public/assets/fish/Sample.png` to "see" the layout of the game.  

The game has a timer using make and drawTextLabel in utils built from assets for TextLabel.imgs in `public/assets/fish/PNG/HUDText`.  In the end, the game all comes down to accuracy of your clicks/shots.  In the end show a accuracy % at the end of the round, that counts upward using makeTextLabel/drawTextLabel.  Clicking on accuracy starts a new round of zombiefish.  

Fish should spawn randomly off-screen and swim, ambulating along in a small group of the same kind if basic fish, not for special fish. Fish should swim at all sorts of angles and velocities.

Fish should be able to be clicked/shoot at, and when clicked, they should disappear with a sound effect.  The game should have a timer that counts down from 99 seconds, and when the timer reaches zero, the game ends and shows the accuracy %.

Special fish are:
* public/assets/fish/PNG/Objects/Fish/fish_brown.png, shooting it adds 3 secs with a "+3" fading floaltingTextLabel.
* public/assets/fish/PNG/Objects/Fish/fish_grey_long_a.png (tail->torso, aka L)+ public/assets/fish/PNG/Objects/Fish/fish_grey_long_b.png (torso->head, aka R) to form grey fish, it subtracts 5 secs with a fading floating textlabel.
Special fish do not swim in groups.

Propose 20 new tasks that further the implementation of the new game zombiefish as a canvas-driven click-based lightgun-shooter game.