var laps = parseInt(readline()),
    checkpointCount = parseInt(readline()),
    checkpoints = [],
    enemyPods = [
        { score: 0 },
        { score: 0 }
    ],
    myPods = [ {
        shieldRechargingCounter: 0
    }, {
        shieldRechargingCounter: 0
    } ];

/**
 * Read state helpers
 */
(function() {
    for (var i = 0, input; i < checkpointCount; i++) {
        input = readline().split(' ');

        checkpoints.push({ x: parseInt(input[0]), y: parseInt(input[1]) });
    }
})();

var getPodsState = function() {
    var enemyOldCheckpoint0 = enemyPods[0].nextCheckPointId,
        enemyOldCheckpoint1 = enemyPods[1].nextCheckPointId;

    getPodInfo(myPods[0]);
    getPodInfo(myPods[1]);

    getPodInfo(enemyPods[0]);
    getPodInfo(enemyPods[1]);

    enemyOldCheckpoint0 !== enemyPods[0].nextCheckPointId &&
    enemyPods[0].score++;

    enemyOldCheckpoint1 !== enemyPods[1].nextCheckPointId &&
    enemyPods[1].score++;
};

var getPodInfo = function(pod) {
    var input = readline().split(' ');

    pod.x = parseInt(input[0]);
    pod.y = parseInt(input[1]);
    pod.vx = parseInt(input[2]);
    pod.vy = parseInt(input[3]);
    pod.angle = parseInt(input[4]);
    pod.nextCheckPointId = parseInt(input[5]);
};

var getEnemyFavorite = function () {
    var enemyFavorite;

    if (enemyPods[0].score > enemyPods[1].score) {
        enemyFavorite = enemyPods[0];
    } else if (enemyPods[0].score < enemyPods[1].score) {
        enemyFavorite = enemyPods[1];
    } else if (
        getDistance(checkpoints[enemyPods[0].nextCheckPointId], enemyPods[0]) <
        getDistance(checkpoints[enemyPods[1].nextCheckPointId], enemyPods[1])
    ) {
        enemyFavorite = enemyPods[0];
    } else {
        enemyFavorite = enemyPods[1];
    }

    return enemyFavorite;
};

var getEnemyTarget = function () {
    var enemyTarget = getFavoritePod(enemyPods);

    if ( ! enemyTarget) {
        if (
            getDistance(checkpoints[enemyPods[0].nextCheckPointId], enemyPods[0]) <
            getDistance(checkpoints[enemyPods[1].nextCheckPointId], enemyPods[1])
        ) {
            enemyTarget = enemyPods[0];
        } else {
            enemyTarget = enemyPods[1];
        }
    }

    return enemyTarget;
};

/**
 * Math constants & helpers
 */
var FULL_ANGLE = 360,
    HORIZON_POSITIVE_VECTOR = { x: 1, y: 0 };

var getVectorMul = function(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
};

var getVector = function(p1, p2) {
    return { x: p2.x - p1.x, y: p2.y - p1.y };
};

//@see http://grafika.me/node/237
var hasIntersection = function(v1, v2) {
    var l34 = getVector(v2[0], v2[1]),
        l31 = getVector(v2[0], v1[0]),
        l32 = getVector(v2[0], v1[1]),
        l12 = getVector(v1[0], v1[1]),
        l13 = getVector(v1[0], v2[0]),
        l14 = getVector(v1[0], v2[1]),
        f1 = getVectorMul(l34, l31),
        f2 = getVectorMul(l34, l32),
        f3 = getVectorMul(l12, l13),
        f4 = getVectorMul(l12, l14);

    return f1 * f2 < 0 && f3 * f4 < 0;
};

/**
 * Math helpers
 */
var getDistance = function(p1, p2) {
    var dx = p1.x - p2.x,
        dy = p1.y - p2.y;

    return Math.sqrt(dx*dx + dy*dy);
};

var getVectorLength = function(v) {
    return Math.sqrt((v.x * v.x + v.y * v.y));
};

var getAngleCos = function(v1, v2) {
    return (v1.x * v2.x + v1.y * v2.y) /
        Math.sqrt((v1.x * v1.x + v1.y * v1.y) * (v2.x * v2.x + v2.y * v2.y));
};

var getAngle = function(v1, v2) {
    return Math.acos(getAngleCos(v1, v2)) * 180 / Math.PI;
};

/**
 * ____x
 * |
 * |
 * y
 *
 *     270
 *      ^
 *      |
 * 180--|--> 0
 *      |
 *      90
 */
var angleToVector = function(angle) {
    return {
        x: Math.cos(angle * Math.PI / 180),
        y: Math.sin(angle * Math.PI / 180)
    };
};

var getPointInZDistanceFromPoint1InDirectionToPoint2 = function(z, p1, p2) {
    var vector = { x: p2.x - p1.x, y: p2.y - p1.y},
        distance = getDistance(p1, p2),
        normVector = { x: vector.x / distance, y: vector.y / distance};

    return {
        x: Math.floor(normVector.x * z + p1.x),
        y: Math.floor(normVector.y * z + p1.y)
    }
};

var OPPOSITE_DIRECTION_ANGEL = 180;

/**
 * Game helpers
 */
var MAX_SPEED = 200,
    NORMAL_SPEED = 170,
    PARKING_SPEED = 40,
    POD_RADIUS = 400,
    CHECKPOINT_RADIUS = 600,
    PIVOT_DISTANCE = 600,
    PARKING_DISTANCE = 2000,
    FAR_AWAY_DISTANCE = 5500,
    FAR_FAR_AWAY_DISTANCE = 7000;

var getCheckpointTarget = function(checkpoint, pod) {
    var target = getCompensationTarget(
        pod,
        checkpoint
    );

    return target;
};

var getCompensationTarget = function(pod, target) {
    return {
        x: Math.floor(target.x - 3 * pod.vx),
        y: Math.floor(target.y - 3 * pod.vy)
    };
};

var DRIFT_LENGTH_IN_STEPS = 3,
    ACC = [ -170, -144, -122, -104, -89, -75 ];

var isDriftModeAvailable = function(pod, target) {
    var afterDriftPosition = { x: pod.x, y: pod.y },
        speed = { x: pod.vx, y: pod.vy },
        speedLength,
        scaleCoeff;

    for (var i = 0; i < DRIFT_LENGTH_IN_STEPS; i++) {
        afterDriftPosition.x += speed.x;
        afterDriftPosition.y += speed.y;

        /*printErr('drift step: ', i);
         printErr('speedLength: ', getVectorLength(speed));
         printErr('speed: ', speed.x, speed.y);
         */
        if (
            Math.abs(afterDriftPosition.x - target.x) <= CHECKPOINT_RADIUS - 100 &&
            Math.abs(afterDriftPosition.y - target.y) <= CHECKPOINT_RADIUS - 100
        ) {
            /*printErr('DRIIIFT!!!');*/

            return true;
        }

        speedLength = getVectorLength(speed);
        scaleCoeff = (speedLength + ACC[i]) / speedLength;

        speed.x *= scaleCoeff;
        speed.y *= scaleCoeff;
    }

    /*printErr('No drift');
     printErr('After drift position: ', afterDriftPosition.x, afterDriftPosition.y);*/

    return false;
};

var calculateTankPodNextState = function(pod) {
    var enemyFavorite = getEnemyFavorite(),
        enemyNextCheckpoint = checkpoints[enemyFavorite.nextCheckPointId],
        target = getPointInZDistanceFromPoint1InDirectionToPoint2(600, enemyFavorite, enemyNextCheckpoint),
        speedVectorLength = getVectorLength({ x: pod.vx, y: pod.vy }),
        distanceToTarget = getDistance(target, pod),
        angleToTarget = getAngle(
            { x: target.x - pod.x, y: target.y - pod.y },
            { x: pod.vx, y: pod.vy }
        ),
        speed = NORMAL_SPEED;

    if (pod.shieldRechargingCounter < 3) {
        pod.shieldRechargingCounter++;
    }

    if ( ! isNaN(angleToTarget)) {
        if (distanceToTarget > FAR_FAR_AWAY_DISTANCE || angleToTarget < 10) {
            speed = MAX_SPEED;
        } else if (distanceToTarget < FAR_AWAY_DISTANCE && angleToTarget > 10 && speedVectorLength > 400) {
            speed = Math.floor(NORMAL_SPEED * (OPPOSITE_DIRECTION_ANGEL - angleToTarget) / OPPOSITE_DIRECTION_ANGEL);
        } else if (distanceToTarget < 1100){
            if (pod.shieldRechargingCounter === 3) {
                speed = 'SHIELD';

                pod.shieldRechargingCounter = 0;
            }
        }

        if (angleToTarget > 18) {
            target = getCompensationTarget(pod, target);
        }
    }

    pod.target = target;
    pod.speed = speed;
};

var calculateRacerPodNextState = function(pod) {
    var nextCheckpoint = checkpoints[pod.nextCheckPointId],
        nextNextCheckpoint = checkpoints[(pod.nextCheckPointId + 1) % checkpoints.length],
        speedVectorLength = Math.floor(getVectorLength({ x: pod.vx, y: pod.vy })),
        distanceToEnemy = Math.min(
            getDistance(enemyPods[0], pod),
            getDistance(enemyPods[1], pod)
        ),
        target = getCheckpointTarget(nextCheckpoint, pod),
        distanceToTarget = getDistance(target, pod),
        distanceToCheckpoint = getDistance(nextCheckpoint, pod),
        angleToCheckpoint = getAngle(
            { x: nextCheckpoint.x - pod.x, y: nextCheckpoint.y - pod.y },
            { x: pod.vx, y: pod.vy }
        ),
        angleToTarget = getAngle(
            { x: target.x - pod.x, y: target.y - pod.y },
            { x: pod.vx, y: pod.vy }
        ),
        speed = MAX_SPEED;

    //Drift mode
    if (isDriftModeAvailable(pod, nextCheckpoint)) {
        target = getCheckpointTarget(nextNextCheckpoint, pod);
        speed = 0;
    }/* else if (distanceToCheckpoint < PARKING_DISTANCE || angleToCheckpoint > 120) {
     speed = Math.max(
         Math.floor(speed * (OPPOSITE_DIRECTION_ANGEL - angleToCheckpoint) / OPPOSITE_DIRECTION_ANGEL),
         PARKING_SPEED
     );
     }*/

    //printErr('Distance to enemy: ', distanceToEnemy);
    //printErr('Distance to target: ', distanceToTarget);
    /*printErr('Angle to target: ', angleToTarget);
     printErr('Speed: ', speed);
     printErr('Speed vector length: ', speedVectorLength);*/

    pod.target = target;
    pod.speed = speed;
};

while (true) {
    getPodsState();

    //printErr('pod 0');
    //calculateTankPodNextState(myPods[0]);
    calculateRacerPodNextState(myPods[0]);
    //printErr('pod 1');
    calculateRacerPodNextState(myPods[1]);

    //print(myPods[0].x, myPods[0].y, 200);
    print(myPods[0].target.x, myPods[0].target.y, myPods[0].speed);
    print(myPods[1].target.x, myPods[1].target.y, myPods[1].speed);
}
