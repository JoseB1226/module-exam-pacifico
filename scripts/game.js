var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x8a2be2];
var currentColorIndex = 0;
var starsCollected = 0; // Counter for stars collected
var starsCollectedText;
var gameOverText;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create ()
{
    // A simple background for our game
    this.add.image(400, 300, 'sky');

    // The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    // Here we create the ground.
    // Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    // Now let's create some ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'dude');

    // Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 1, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // Input Events
    cursors = this.input.keyboard.createCursorKeys();

    // Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {

        // Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    // Create bombs
    bombs = this.physics.add.group();

    for (var i = 0; i < 3; i++) { // Create 3 bombs initially
        var x = Phaser.Math.Between(0, config.width);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }

    // The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    // Stars Collected UI
    starsCollectedText = this.add.text(config.width - 16, 16, ' Coin Stars Collected: 0', { fontSize: '32px', fill: '#000' });
    starsCollectedText.setOrigin(1, 0);

    // Game Over Text
    gameOverText = this.add.text(config.width / 2, config.height / 2, 'GAME OVER', { fontSize: '64px', fill: '#f00' });
    gameOverText.setOrigin(0.5);
    gameOverText.setVisible(false);

    // Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    // Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update ()
{
    if (gameOver)
    {
        return;
    }

    // Reset player velocity
    player.setVelocityX(0);

    // Player movement
    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else
    {
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    // Increment starsCollected counter
    starsCollected++;

    // Update starsCollected UI
    starsCollectedText.setText('Coin Stars Collected: ' + starsCollected);

    // Change the color of the player
    player.setTint(colors[currentColorIndex]);

    // Increment the color index and wrap around if needed
    currentColorIndex = (currentColorIndex + 1) % colors.length;

    // Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    // Create a new star at a random position
    var newX = Phaser.Math.Between(0, config.width);
    var newY = Phaser.Math.Between(0, config.height);
    var newStar = stars.create(newX, newY, 'star');
    newStar.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    // Check if there are no active stars left, then create a new batch
    if (stars.countActive(true) === 0)
    {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        // Randomly create a bomb as well
        var x = Phaser.Math.Between(0, config.width);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }

    // Check if the player has collected 5 stars
    if (starsCollected % 5 === 0) {
        // Increase player's scale by 10%
        player.setScale(player.scaleX * 1.1, player.scaleY * 1.1);
    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);
    player.setVisible(false); // Hide the player

    // Display Game Over Text
    gameOverText.setVisible(true);

    gameOver = true;
}
