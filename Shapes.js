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
        console.log(this.base_vertices, this.top_vertices);

    }

    /**
     * Renders cone
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {GLint} a_Position Position Attribute
     * @param {WebGLUniformLocation} u_FragColor Color uniform
     * @param {WebGLUniformLocation} u_Matrix Matrix uniform
     */
    render(gl, a_Position, u_FragColor, u_Matrix){
        if (true){
            this.baseVertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.baseVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.base_vertices, gl.STATIC_DRAW);
        }


        drawPrimitive(gl, gl.TRIANGLE_FAN, 
            this.base_vertices.length / 3,
            this.base_vertices,
            this.matrix,
            this.color,
            a_Position, u_FragColor, u_Matrix, this.baseVertBuffer
        );

        if (true){
            this.topVertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.topVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.top_vertices, gl.STATIC_DRAW);
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
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        }

        if (this.uvBuffer == null){
            this.uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
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
        this.block_count = 0;
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
            gl.bufferData(gl.ARRAY_BUFFER, this.inst.uvs, gl.STREAM_DRAW);

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