'use strict';

class Camera {
    constructor(aspect){
        this.fov = 60;
        this.eye = new Vector3();
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(
            ...this.eye.elements,
            ...this.at.elements,
            ...this.up.elements
        );
        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.perspective(
            this.fov,
            aspect,
            0.1,
            1000
        );
    }

    #move(forward, left, up){        
        let lookDir = new Vector3(this.at.elements);
        lookDir.sub(this.eye);
        lookDir.normalize();

        let perpDir = Vector3.cross(this.up, lookDir);
        perpDir.normalize();

        let upDir = new Vector3(this.up.elements);
        upDir.normalize();
        
        lookDir.mul(forward);
        perpDir.mul(left);
        upDir.mul(up);

        let total = new Vector3([0, 0, 0]);
        total.add(lookDir);
        total.add(perpDir);
        total.add(upDir);

        this.eye.add(total);
        this.at.add(total);

        this.viewMatrix.setLookAt(
            ...this.eye.elements,
            ...this.at.elements,
            ...this.up.elements
        );
    }

    #pan(x, y){
        let lookDir = new Vector3(this.at.elements);
        lookDir.sub(this.eye);

        let perpDir = Vector3.cross(this.up, lookDir);
        perpDir.normalize();        

        let rotMat = new Matrix4();
        rotMat.rotate(x, ...this.up.elements);
        rotMat.rotate(y, ...perpDir.elements);
        lookDir = rotMat.multiplyVector3(lookDir);
        
        lookDir.add(this.eye);
        this.at = lookDir;

        this.viewMatrix.setLookAt(
            ...this.eye.elements,
            ...this.at.elements,
            ...this.up.elements
        );
    }

    moveForwards = (speed) => this.#move(speed, 0, 0);
    moveBackwards = (speed) => this.#move(-speed, 0, 0);
    moveLeft = (speed) => this.#move(0, speed, 0);
    moveRight = (speed) => this.#move(0, -speed, 0);
    panLeft = (angle) => this.#pan(angle, 0);
    panRight = (angle) => this.#pan(-angle, 0);
    panUp = (angle) => this.#pan(0, angle);
    panDown = (angle) => this.#pan(0, -angle);
}