'use strict';

/**
 * Creates and draws buffer of points
 * @param {WebGLRenderingContext} gl WebGL rendering context
 * @param {Number} drawType Primitive type to pass to drawArrays
 * @param {Number} n Number of vertices per primative
 * @param {Float32Array} vertices Vertices of object
 * @param {Matrix4} matrix Model matrix
 * @param {Number[]} color RGB 0-1 color
 * @param {GLint} a_Position Attribute that positions primitive
 * @param {WebGLUniformLocation} u_FragColor Uniform that determines color of primitive
 * @param {WebGLUniformLocation} u_Matrix Uniform does matrix transform on the primative
 */
function drawPrimitive(gl, drawType, n, vertices, matrix, color, 
    a_Position, u_FragColor, u_Matrix, vertBuffer){

    gl.uniform4f(u_FragColor, ...color, 1);
    gl.uniformMatrix4fv(u_Matrix, false, matrix.elements);

    if(!vertBuffer){
        throw new Error('No vert buffer!');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(drawType, 0, n);
}

var vertBuffer = null;
var uvBuffer = null;
/**
 * Creates and draws buffer of points
 * @param {WebGLRenderingContext} gl WebGL rendering context
 * @param {Number} drawType Primitive type to pass to drawArrays
 * @param {Number} n Number of vertices per primative
 * @param {Float32Array} vertices Vertices of object
 * @param {Float32Array} uvs UVs of object
 * @param {Matrix4} matrix Model matrix
 * @param {GLint} a_Position Attribute that positions primitive
 * @param {GLint} a_UV Attribute that sends UV coordinates of texture
 * @param {WebGLUniformLocation} u_Matrix Uniform does matrix transform on the primative
 */
function drawPrimitiveUV(gl, drawType, n, vertices, uvs, matrix, 
    a_Position, a_UV, u_Matrix, vertBuffer, uvBuffer){

    gl.uniformMatrix4fv(u_Matrix, false, matrix.elements);

    if(!vertBuffer){
        throw new Error('Could not create vert buffer!');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if(!uvBuffer){
        throw new Error('Could not create UV buffer!');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(drawType, 0, n);
}


/**
 * Draws a 3D triangle onto the screen
 * @param {WebGLRenderingContext} gl Rendering context
 * @param {Float32Array} vertices Vertices of triangle
 * @param {Number[]} color Color of triangle
 * @param {Matrix4} matrix Transformation Matrix
 * @param {GLint} a_Position Position attribute to use in buffer
 * @param {WebGLUniformLocation} u_FragColor Color uniform
 * @param {WebGLUniformLocation} u_Matrix Matrix uniform
 */
function drawTriangle3D(gl, vertices, color, matrix, a_Position, u_FragColor, u_Matrix){
    drawPrimitive(gl, gl.TRIANGLES, 3, vertices, matrix, color, a_Position, u_FragColor, u_Matrix)
}

class Cube {

    baseVerts = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
    ];

    // Adapted from https://stackoverflow.com/questions/58772212/what-are-the-correct-vertices-and-indices-for-a-cube-using-this-mesh-function
    baseInd = [
        //Top
        2, 6, 7,
        2, 3, 7,

        //Bottom
        0, 4, 5,
        0, 1, 5,

        //Left
        0, 2, 6,
        0, 4, 6,

        //Right
        1, 3, 7,
        1, 5, 7,

        //Front
        0, 2, 3,
        0, 1, 3,

        //Back
        4, 6, 7,
        4, 5, 7
    ];

    /**
     * Cube constructor
     * @param {Matrix4} matrix Transformation Matrix
     * @param {Number[][] | Number[]} face_colors Color for each face or single color for all faces.
     * @param {Number[]} scale Scale of x, y, z faces
     * 
     * If specifying each color individually, the order is:
     *  1. Top
     *  2. Bottom
     *  3. Left
     *  4. Right
     *  5. Front
     *  6. Back 
     */
    constructor (matrix, face_colors, scale) {

        // Construct vertices, too lazy to do this by hand
        this.vertices = [];
        for (var i = 0; i < this.baseInd.length; i++){
            var [x, y, z] = this.baseVerts[this.baseInd[i]];
            this.vertices.push(
                (x - 0.5) * 2 * scale[0],
                (y - 0.5) * 2 * scale[1],
                (z - 0.5) * 2 * scale[2],
            )
        }
        this.vertices = new Float32Array(this.vertices);

        // Handle passing either a single color for whole cube, or one color per face
        if (!(face_colors[0] instanceof Array) && (face_colors instanceof Array)){
            this.face_colors = [];
            for (var i = 0; i < 8; i++){
                this.face_colors.push(face_colors);
            }
        } else {
            this.face_colors = face_colors;
        }


        this.matrix = matrix;
        this.vertBuffer = null;
    }

    /**
     * Renders cube
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {GLint} a_Position Position Attribute
     * @param {WebGLUniformLocation} u_FragColor Color uniform
     * @param {WebGLUniformLocation} u_Matrix Matrix uniform
     */
    render(gl, a_Position, u_FragColor, u_Matrix){
        
        if (this.vertBuffer == null){
            this.vertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        }

        drawPrimitive(gl, gl.TRIANGLES, this.vertices.length / 3, this.vertices, 
            this.matrix, this.face_colors[0], a_Position, u_FragColor, u_Matrix,
            this.vertBuffer
        );
    }
}

class Cone {

    SEGMENTS = 10

    constructor(matrix, color, radius, height){
        this.matrix = matrix;
        this.color = color;

        this.base_vertices = [0, 0, 0];
        this.top_vertices = [0, height, 0];
        for (var i = 0; i <= this.SEGMENTS; i++){
            let angle = 2 * Math.PI / this.SEGMENTS * i;
            let vert = [
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
            ];
            this.base_vertices.push(...vert);
            this.top_vertices.push(...vert);
        }

        this.base_vertices = new Float32Array(this.base_vertices);
        this.top_vertices = new Float32Array(this.top_vertices);

        this.topVertBuffer = null;
        this.baseVertBuffer = null;

    }

    /**
     * Renders cone
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {GLint} a_Position Position Attribute
     * @param {WebGLUniformLocation} u_FragColor Color uniform
     * @param {WebGLUniformLocation} u_Matrix Matrix uniform
     */
    render(gl, a_Position, u_FragColor, u_Matrix){
        if (this.baseVertBuffer == null){
            this.baseVertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.baseVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.base_vertices, gl.DYNAMIC_DRAW);
        }


        drawPrimitive(gl, gl.TRIANGLE_FAN, 
            this.base_vertices.length / 3,
            this.base_vertices,
            this.matrix,
            this.color,
            a_Position, u_FragColor, u_Matrix, this.baseVertBuffer
        );

        if (this.topVertBuffer == null){
            this.topVertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.topVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.top_vertices, gl.DYNAMIC_DRAW);
        }

        drawPrimitive(gl, gl.TRIANGLE_FAN, 
            this.top_vertices.length / 3,
            this.top_vertices,
            this.matrix,
            this.color,
            a_Position, u_FragColor, u_Matrix, this.topVertBuffer
        );
    }
}

class TexCube extends Cube {
    
    uvs = [ 
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
        0,0, 1,0, 1,1, 
        0,0, 0,1, 1,1,
    ];
    
    /**
     * Constructor
     * @param {Matrix4} matrix 
     * @param {String | String[]} face_texs 
     * @param {[Number, Number, Number]} scale 
     */
    constructor(matrix, face_texs, scale){
        super(matrix, [0, 0, 0], scale);
        this.face_texs = this.face_texs instanceof Array ? face_texs : Array(8).fill(face_texs);
        // var nuv = [];
        // for (var i = 0; i < 8; i++){
        //     nuv.push(...this.uvs);
        // }
        this.uvs = new Float32Array(this.uvs);
        this.uvBuffer = null;
    }

    render(gl, a_Position, a_UV, u_Matrix){
        if (this.vertBuffer == null){
            this.vertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        }

        if (this.uvBuffer == null){
            this.uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
        }

        drawPrimitiveUV(gl, gl.TRIANGLES, this.vertices.length / 3, this.vertices, this.uvs, this.matrix, 
            a_Position, a_UV, u_Matrix, this.vertBuffer, this.uvBuffer
        );
    }
}

class World {

    /**
     * World Constructor
     * @param {Number[][]} blockHeights Heights of each block tower in the world
     */
    constructor (blockHeights, cubeSize){
        /**@type {Number} */
        this.block_count = 0;
        /**@type {Boolean[][][]} */
        this.cubes = [];
        for (var z = 0; z < blockHeights.length; z++){
            this.cubes.push([]);
            for (var x = 0; x < blockHeights[z].length; x++){
                this.cubes[z].push([]);
                for (var y = 0; y < blockHeights[z][x]; y++){
                    this.cubes[z][x].push(true);
                    this.block_count++;
                }
            }
        }



        this.cubeSize = cubeSize;
        this.inst = new TexCube(new Matrix4(), null, new Array(3).fill(this.cubeSize));
        this.offset_cache = null;
        this.offsetBuffer = null;

        this.uvBuffer = null;
        this.vertexBuffer = null;
    }

    render(gl, a_Position, a_UV, u_Matrix){
        this.block_count = 0;
        for (var z = 0; z < this.cubes.length; z++){
            for (var x = 0; x < this.cubes[z].length; x++){
                for (var y = 0; y < this.cubes[z][x].length; y++){
                    if (this.cubes[z][x][y]){
                        this.inst.matrix.setTranslate(
                            (x - this.cubes[z].length / 2) * 2 * this.cubeSize, 
                            y * 2 * this.cubeSize, 
                            (z - this.cubes.length / 2) * 2 * this.cubeSize);
                        this.inst.render(gl, a_Position, a_UV, u_Matrix);
                        this.block_count++;
                    }
                }
            }
        }
    }

    point2Grid(x, y, z){
        return [
            Math.max(0, Math.round(x / (2 * this.cubeSize) + (this.cubes[0].length / 2))),
            Math.max(0, Math.round(y / (2 * this.cubeSize))),
            Math.max(0, Math.round(z / (2 * this.cubeSize) + (this.cubes.length / 2)))
        ];
    }

    changePoint(x, y, z, isBlock){
        var [gx, gy, gz] = this.point2Grid(x, y, z);
        this.cubes[gz][gx][gy] = isBlock;
        this.offset_cache = null;
        this.block_count = 0;
    }
    
    /**
     * Renders in
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {ANGLE_instanced_arrays} ext Instanced Arrays extension
     * @param {GLint} a_Position Attribute that positions primitive
     * @param {GLint} a_UV Attribute that sends UV coordinates of texture
     * @param {GLint} a_offset Attribute does matrix transform on the primative
     * @param {WebGLUniformLocation} u_doingInstances
     */
    renderFast(gl, ext, a_Position, a_UV, a_offset, u_doingInstances){

        gl.uniform1i(u_doingInstances, 1);

        if(this.vertBuffer == null) {
            this.vertBuffer = gl.createBuffer();
            if(!this.vertBuffer){
                throw new Error('Could not create vert buffer!');
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.inst.vertices, gl.DYNAMIC_DRAW);

        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        if (this.uvBuffer == null) {
            this.uvBuffer = gl.createBuffer();
            if(!this.uvBuffer){
                throw new Error('Could not create UV buffer!');
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.inst.uvs, gl.DYNAMIC_DRAW);

        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        if (this.offsetBuffer == null) this.offsetBuffer = gl.createBuffer();
        if(!this.offsetBuffer){
            throw new Error('Could not create UV buffer!');
        }

        if (this.offset_cache == null){
            this.offset_cache = [];
            this.block_count = 0;
            for (var z = 0; z < this.cubes.length; z++){
                for (var x = 0; x < this.cubes[z].length; x++){
                    for (var y = 0; y < this.cubes[z][x].length; y++){
                        if (this.cubes[z][x][y]){
                            this.offset_cache.push(
                                (x - this.cubes[z].length / 2) * 2 * this.cubeSize, 
                                y * 2 * this.cubeSize, 
                                (z - this.cubes.length / 2) * 2 * this.cubeSize
                            );
                            this.block_count++;
                        }
                    }
                }
            }

            this.offset_cache = new Float32Array(this.offset_cache);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.offset_cache, gl.DYNAMIC_DRAW);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
        gl.vertexAttribPointer(a_offset, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_offset);
        ext.vertexAttribDivisorANGLE(a_offset, 1);

        // gl.drawArraysInstanced(drawType, 0, n);
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, this.inst.vertices.length / 3, this.offset_cache.length / 3);

        gl.uniform1i(u_doingInstances, 0);
        // console.log(gl.getBufferParameter(this.uvBuffer, gl.BUFFER_SIZE));
        // console.log(gl.getBufferParameter(this.offsetBuffer, gl.BUFFER_SIZE));
    }
}

class Cat {

    constructor(){
        this.furLight = [255/255, 153/255, 20/255];
        this.furDark = [173/255, 104/255, 14/255];
        this.white = this.furLight;
        this.black = [0, 0, 0];
        this.nose = [235/255, 89/255, 121/255];
        this.noseFacesColors = [
            this.furDark, 
            this.furDark, 
            this.nose,
            this.furDark,
            this.furDark,
            this.furDark
        ]

        this.proximalTail = new Cube(new Matrix4(), this.furLight, [0.03, 0.03, 0.08]);
        this.midTail = new Cube(new Matrix4(), this.furDark, [0.025, 0.025, 0.085]);
        this.distalTail = new Cube(new Matrix4(), this.furLight, [0.02, 0.02, 0.09]);
        this.head = new Cube(new Matrix4(), this.furLight, [0.13, 0.13, 0.13]);
        this.leftEar = new Cube(new Matrix4(), this.noseFacesColors, [0.05, 0.05, 0.005]);
        this.leftEye = new Cube(new Matrix4(), this.black, [0.01, 0.03, 0.0]);
        this.leftBottomWhisker = new Cube(new Matrix4(), this.black, [0.01, 0.04, 0.0]);
        this.leftTopWhisker = new Cube(new Matrix4(), this.black, [0.01, 0.04, 0.0]);
        this.noseTop = new Cube(new Matrix4(), this.nose, [0.03, 0.01, 0.0]);
        this.nosebottom = new Cube(new Matrix4(), this.nose, [0.01, 0.01, 0.0]);
        this.rightEar = new Cube(new Matrix4(), this.noseFacesColors, [0.05, 0.05, 0.005]);
        this.rightEye = new Cube(new Matrix4(), this.black, [0.01, 0.03, 0.0]);
        this.rightBottomWhisker = new Cube(new Matrix4(), this.black, [0.01, 0.04, 0.0]);
        this.rightTopWhisker = new Cube(new Matrix4(), this.black, [0.01, 0.04, 0.0]);
        this.partyHat = new Cone(new Matrix4(), [1, .3, .3], .08, .16);
        this.body = new Cube(new Matrix4(), this.furLight, [0.12, 0.07, 0.26]);
        this.leftBackLeg = new Cube(new Matrix4(), this.furDark, [0.03, 0.1, 0.03]);
        this.leftBackToe = new Cube(new Matrix4(), this.white, [0.03, 0.02, 0.03]);
        this.leftFrontLeg = new Cube(new Matrix4(), this.furDark, [0.03, 0.1, 0.03]);
        this.leftFrontToe = new Cube(new Matrix4(), this.white, [0.03, 0.02, 0.03]);
        this.rightFrontLeg = new Cube(new Matrix4(), this.furDark, [0.03, 0.1, 0.03]);
        this.rightFrontToe = new Cube(new Matrix4(), this.white, [0.03, 0.02, 0.03]);
        this.rightBackLeg = new Cube(new Matrix4(), this.furDark, [0.03, 0.1, 0.03]);
        this.rightBackToe = new Cube(new Matrix4(), this.white, [0.03, 0.02, 0.03]);

    }

    render(gl, fullModelM, time, a_Position, u_FragColor, u_ModelMatrix){
        // Clear <canvas>
      
        let proxTXSlider = -30;
        let midTXSlider = -10;
        let distTXSlider = -10;
        let proxTYSlider = 45 * Math.sin(time / 30);
        let midTYSlider = 20 * Math.sin(time / 30);
        let distTYSlider = 10 * Math.sin(time / 30);
        let leftLegsRot = 20 * Math.sin(time / 30);
        let rightLegsRot = 20 * Math.cos(time / 30 + .5)
      
        // Proximal Tail
        this.proximalTail.matrix = new Matrix4(fullModelM);
        this.proximalTail.matrix.translate(0.008, 0.025, 0.06);
        this.proximalTail.matrix.rotate(proxTYSlider, 0, 1, 0);
        this.proximalTail.matrix.rotate(proxTXSlider, 1, 0, 0);
        this.proximalTail.matrix.translate(0, 0, 0.08/2);
        
        // Mid Tail
        this.midTail.matrix = new Matrix4(this.proximalTail.matrix);
        this.midTail.matrix.translate(0, 0, .13 - 0.085/2);
        this.midTail.matrix.rotate(midTYSlider, 0, 1, 0);
        this.midTail.matrix.rotate(midTXSlider, 1, 0, 0);
        this.midTail.matrix.translate(0, 0, 0.085/2);
      
        // Distal Tail
        this.distalTail.matrix = new Matrix4(this.midTail.matrix);
        this.distalTail.matrix.translate(0, 0, .14 - 0.09/2);
        this.distalTail.matrix.rotate(distTYSlider, 0, 1, 0);
        this.distalTail.matrix.rotate(distTXSlider, 1, 0, 0);
        this.distalTail.matrix.translate(0, 0, 0.09/2);
        
        
        // Head
        this.head.matrix = new Matrix4(fullModelM);
        this.head.matrix.translate(0.0, 0.086, -0.627);
        this.head.matrix.rotate(0.0, 0.0, 0.0, -1.0);  
        
        
        this.leftEar.matrix = new Matrix4(fullModelM);
        this.leftEar.matrix.translate(-0.06, 0.196, -0.707);
        this.leftEar.matrix.rotate(54.17, 0.22, -0.54, -0.81);  
        
        // Left Eye
        this.leftEye.matrix = new Matrix4(fullModelM);
        this.leftEye.matrix.translate(-0.064, 0.142, -0.763);
        this.leftEye.matrix.rotate(0.0, 0.0, 0.0, -1.0);
      
        // Left-Bottom Whisker
        this.leftBottomWhisker.matrix = new Matrix4(fullModelM);
        this.leftBottomWhisker.matrix.translate(-0.124, 0.037, -0.763);
        this.leftBottomWhisker.matrix.rotate(73.32, 0.0, 0.0, -1.0);  
      
        // Left-Top Whisker
        this.leftTopWhisker.matrix = new Matrix4(fullModelM);
        this.leftTopWhisker.matrix.translate(-0.124, 0.086, -0.763);
        this.leftTopWhisker.matrix.rotate(73.32, 0.0, 0.0, 1.0);
        
        // Nose Top
        this.noseTop.matrix = new Matrix4(fullModelM);
        this.noseTop.matrix.translate(0.0, 0.072, -0.765);
        this.noseTop.matrix.rotate(0.0, 0.0, 0.0, -1.0);
      
        // NoseBottom
        this.nosebottom.matrix = new Matrix4(fullModelM);
        this.nosebottom.matrix.translate(0.0, 0.049, -0.765);
        this.nosebottom.matrix.rotate(0.0, 0.0, 0.0, -1.0);  
      
        // Right Ear
        this.rightEar.matrix = new Matrix4(fullModelM);
        this.rightEar.matrix.translate(0.06, 0.196, -0.707);
        this.rightEar.matrix.rotate(54.17, -0.22, 0.54, -0.81);  
      
        // Right Eye
        this.rightEye.matrix = new Matrix4(fullModelM);
        this.rightEye.matrix.translate(0.064, 0.142, -0.763);
        this.rightEye.matrix.rotate(0.0, 0.0, 0.0, -1.0);
        
        // Right-Bottom Whisker
        this.rightBottomWhisker.matrix = new Matrix4(fullModelM);
        this.rightBottomWhisker.matrix.translate(0.124, 0.037, -0.763);
        this.rightBottomWhisker.matrix.rotate(106.68, 0.0, 0.0, -1.0);
      
        // Right-Top Whisker
        this.rightTopWhisker.matrix = new Matrix4(fullModelM);
        this.rightTopWhisker.matrix.translate(0.124, 0.086, -0.763);
        this.rightTopWhisker.matrix.rotate(106.69, 0.0, -0.0, 1.0);
        
        // Party Hat
        this.partyHat.matrix = new Matrix4(fullModelM);
        this.partyHat.matrix.translate(0.0, 0.2 + 0, -0.6);
      
      
        // Body
        this.body.matrix = new Matrix4(fullModelM);
        this.body.matrix.translate(0.0, -0.014, -0.238);
        this.body.matrix.rotate(0.0, 0.0, 0.0, -1.0);
        
        
      
        // Left-Back Leg
        this.leftBackLeg.matrix = new Matrix4(fullModelM);
        this.leftBackLeg.matrix.translate(-0.086, -0.178, -0.015);
        this.leftBackLeg.matrix.translate(0, 0.07, 0.015);
        this.leftBackLeg.matrix.rotate(leftLegsRot, 1.0, 0.0, -0.0);
        this.leftBackLeg.matrix.translate(0, -0.07, -0.015);
        // Left-Back Toe
        this.leftBackToe.matrix = new Matrix4(this.leftBackLeg.matrix);
        this.leftBackToe.matrix.translate(0, -0.254 + .178, -0.040);
        
      
        // Left-Front Leg
        this.leftFrontLeg.matrix = new Matrix4(fullModelM);
        this.leftFrontLeg.matrix.translate(-0.086, -0.178, -0.455);
        this.leftFrontLeg.matrix.translate(0, 0.07, 0.015);
        this.leftFrontLeg.matrix.rotate(leftLegsRot, 1.0, 0.0, -0.0);
        this.leftFrontLeg.matrix.translate(0, -0.07, -0.015);
        // Left-Front Toe
        this.leftFrontToe.matrix = new Matrix4(this.leftFrontLeg.matrix);
        this.leftFrontToe.matrix.translate(0, -0.254 + .178, -0.494 + .455);
        
      
        // Right-Front Leg
        this.rightFrontLeg.matrix = new Matrix4(fullModelM);
        this.rightFrontLeg.matrix.translate(0.086, -0.178, -0.455);
        this.rightFrontLeg.matrix.translate(0, 0.07, 0.015);
        this.rightFrontLeg.matrix.rotate(rightLegsRot, 1.0, 0.0, -0.0);
        this.rightFrontLeg.matrix.translate(0, -0.07, -0.015);
        // Right-Front Toe
        this.rightFrontToe.matrix = new Matrix4(this.rightFrontLeg.matrix);
        this.rightFrontToe.matrix.translate(0, -0.254 + .178, -0.494 + .455);
        
        
        // Right-Back Leg
        this.rightBackLeg.matrix = new Matrix4(fullModelM);
        this.rightBackLeg.matrix.translate(0.086, -0.178, -0.015);
        this.rightBackLeg.matrix.translate(0, 0.07, 0.015);
        this.rightBackLeg.matrix.rotate(rightLegsRot, 1.0, 0.0, -0.0);
        this.rightBackLeg.matrix.translate(0, -0.07, -0.015);
        // Right-Back Toe
        this.rightBackToe.matrix = new Matrix4(this.rightBackLeg.matrix);
        this.rightBackToe.matrix.translate(0, -0.254 + .178, -.040);
        
        
        this.proximalTail.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.midTail.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.distalTail.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.head.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftEar.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftEye.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftBottomWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftTopWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.noseTop.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.nosebottom.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightEar.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightEye.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightBottomWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightTopWhisker.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.body.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftBackLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftFrontLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightFrontToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightBackLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightFrontLeg.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftFrontToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.leftBackToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.rightBackToe.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        this.partyHat.render(gl, a_Position, u_FragColor, u_ModelMatrix);
        
      }
}

// class Shape {

//     /**
//      * 
//      * @param {Matrix4} matrix Transformation Matrix
//      * @param {Float32Array} color 
//      * @param {Float32Array} vertices 
//      */
//     constructor(matrix, color, vertices){
//         this.matrix = matrix;
//         this.color = color;
//         this.vertices = new Float32Array(vertices);
//     }
    
//     /**
//      * Creates and draws buffer of points
//      * @param {WebGLRenderingContext} gl WebGL rendering context
//      * @param {Number} drawType Primitive type to pass to drawArrays
//      * @param {Number} n Number of vertices per primative
//      * @param {GLint} a_Position Attribute that positions primitive
//      * @param {WebGLUniformLocation} u_FragColor Uniform that determines color of primitive
//      */
//     render(gl, drawType, n, a_Position, u_FragColor){

//         gl.uniform4f(u_FragColor, ...this.color);

//         var vertBuffer = gl.createBuffer();
//         if(!vertBuffer){
//             throw new Error('Could not create buffer!');
//         }

//         gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
//         gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
//         gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
//         gl.enableVertexAttribArray(a_Position);
//         gl.drawArrays(drawType, 0, n);
//     }
// }