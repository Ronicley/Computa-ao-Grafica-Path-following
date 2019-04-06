

var path;

var car1;
var car2;
var car3;
var car4;

function setup() {
    createCanvas(800, 600);
    //Cria um novo caminho
    newPath();

    //new Vehicle(posição inicial x, posição inicial y, velocidade maxima: ms, força maxima: mf, Massa do veiculo ou Boid)
    car1 = new Vehicle(0, height / 2, 2, 0.04, 4);
    car2 = new Vehicle(0, height / 2, 2, 0.02, 1);
    car3 = new Vehicle(0, height / 2, 1, 0.03, 1);
    car4 = new Vehicle(0, height / 2, 3, 0.05, 1);
}

function draw() {
    background(0);
    // Desenha o caminho
    path.display();
    // diz o caminho que o Boid tem que seguir
    car1.follow(path);
    car2.follow(path);
    car3.follow(path);
    car4.follow(path);

    car1.run();
    car2.run();
    car3.run();
    car4.run()
    //Verifique se chegou ao final do caminho, já que não é um loop
    car1.borders(path);
    car2.borders(path);
    car3.borders(path);
    car4.borders(path);
}

function newPath() {
    // Um caminho é uma serie de pontos conectados
    // Um caminho mais sofisticado pode ser uma curva
    path = new Path();
    //adiciona os pontos, sendo que inicio e fim são estaticos e caminhos intermediarios são dinamicos 
    path.addPoint(0, height/2);
    path.addPoint(random(0, width / 4), random(0, height / 5));
    path.addPoint(random(0, width / 6), random(0, height / 2));
    path.addPoint(random(width / 2, width), random(0, height / 3));
    path.addPoint(width, height);
}


//Quando o mouse é pressionando um novo caminho é desenhado
function mousePressed() {
    newPath();
}
function Vehicle(x, y, ms, mf, mass) {
    //cria um vetor na posição x e y
    this.position = createVector(x, y);
    //cria o vetor de aceleração
    this.acceleration = createVector(0, 0);
    //cria o vetor de velocidade
    this.velocity = createVector(2, 0);
    //massa do Boid
    //Como o canvas é pequeno é interessante deixar entre valor de 1 a, no maximo 9.
    //Para que possa ser possivel ver o movimento dos Boids com diferentes massas
    this.mass = mass
    //Raio de curva. Serve para que o Boid não faça curvas fechadas,
    // respeitando por exemplo a força centrifuga
    //Quanto maior o valor, mais aberta é a curva feita pelo Boid 
    this.r = 5;
    //define a velocidade maxima que vai de ms(valor definido pelo usuario) até 5
    this.maxspeed = ms || 5;
    //O mesmo conceito de velocidade se aplica para foça
    this.maxforce = mf || 0.1;

    this.run = function () {
        this.update();
        this.display();
    };
    this.follow = function (p) {


        //Prever a localização 50 (escolha arbitrária) de quadros à frente
        // Isso pode ser baseado na velocidade
        var predict = this.velocity.copy();
        predict.normalize();
        predict.mult(10);
        var predictLoc = p5.Vector.add(this.position, predict);

        // Agora devemos encontrar o normal para o caminho do local previsto
        // Nós olhamos o normal para cada segmento de linha e escolhemos o mais próximo

        var normal = null;
        var target = null;
        var worldRecord = 1000000;  // começa com uma distância recorde muito alta que pode ser facilmente vencida

        // passa por todos os pontos do caminho
        for (var i = 0; i < p.points.length - 1; i++) {

            // Olhe para um segmento de linha
            var a = p.points[i];
            var b = p.points[i + 1];

            // obtem o ponto normal para essa linha
            var normalPoint = getNormalPoint(predictLoc, a, b);
            // Isso só funciona porque sabemos que o nosso caminho vai da esquerda para a direita
            // Poderíamos ter um teste mais sofisticado para saber se o ponto está no segmento de linha ou não
            if (normalPoint.x < a.x || normalPoint.x > b.x) {
                //Isso como uma solução hacky, mas se não estiver dentro do segmento de linha
                //considere o normal para ser apenas o fim do segmento de linha (ponto b)
                normalPoint = b.copy();
            }
            var distance = p5.Vector.dist(predictLoc, normalPoint);
            if (distance < worldRecord) {
                worldRecord = distance;
                normal = normalPoint;

                // Olhe para a direção da linha para que possamos buscar um pouco à frente do normal
                var dir = p5.Vector.sub(b, a);
                dir.normalize();
                // Isso é uma simplificação excessiva
                // Deve ser baseado na distância ao caminho e velocidade
                dir.mult(10);
                target = normalPoint.copy();
                target.add(dir);
            }
        }

        // Somente se a distância for maior que o raio do caminho nos preocupamos em virar
        if (worldRecord > p.radius && target !== null) {
            this.seek(target);
        }
    };


    this.applyForce = function (force) {
        this.acceleration.add(force);
        this.acceleration.div(this.mass)
    };

    // método que calcula e aplica força em direção a um alvo
    this.seek = function (target) {
        var desired = p5.Vector.sub(target, this.position);  // Um vetor apontando da posição para o alvo

        //Se a magnitude do alvo for igual a 0, pule para fora daqui
        if (desired.x === 0 && desired.y === 0) return;

        // Normaliza e dimensiona para velocidade máxima
        desired.normalize();
        desired.mult(this.maxspeed);
        var steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce);  //limita à força da direção máxima

        this.applyForce(steer);
    };

    // Método para atualizar a posição
    this.update = function () {
        // atualiza a velocidade
        this.velocity.add(this.acceleration);
        // Limita a velocidade
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        // Reinicia a aceleração para 0 à cada ciclo
        this.acceleration.mult(0);
    };

    // Verifica as bordas
    this.borders = function (p) {
        if (this.position.x > p.getEnd().x + this.r) {
            this.position.x = p.getStart().x - this.r;
            this.position.y = p.getStart().y + (this.position.y - p.getEnd().y);
        }
    };

    this.display = function () {
        // Desenha um triangulo rotacionado na direçao da velocidade
        var theta = this.velocity.heading() + PI / 2;
        fill(127);
        stroke(255);
        strokeWeight(1);
        push();
        translate(this.position.x, this.position.y);
        fill(255)
        text('Massa: '+this.mass,this.r , this.r * 2);
        rotate(theta);
        beginShape();
        vertex(0, -this.r * 2);
        vertex(-this.r, this.r * 2);
        vertex(this.r, this.r * 2);
        endShape(CLOSE);
        pop();
        
    };

    //função para obter o ponto normal de um ponto (p) para um segmento de linha (a-b)
    var getNormalPoint = function (p, a, b) {
        // Vetor de a para p
        var ap = p5.Vector.sub(p, a);
        // Vetor de a para b
        var ab = p5.Vector.sub(b, a);
        ab.normalize(); // normaliza a linha
        ab.mult(ap.dot(ab));
        var normalPoint = p5.Vector.add(a, ab);
        return normalPoint;
    };
}


function Path() {
    // Um ​​caminho tem um raio, ou seja, até que ponto está tudo bem para o veículo se desviar
    this.radius = 20;
    // Um caminho é um array de pontos (p5.Vector objects)
    this.points = [];

    // Adiciona os pontos do caminho
    this.addPoint = function (x, y) {
        var point = createVector(x, y);
        this.points.push(point);
    };

    this.getStart = function () {
        return this.points[0];
    };

    this.getEnd = function () {
        return this.points[this.points.length - 1];
    };


    // Denha o caminho
    this.display = function () {
        // Denha uma linha grossa para o raio
        stroke(0);
        strokeWeight(this.radius * 1.5);
        noFill();
        beginShape();
        for (var i = 0; i < this.points.length; i++) {
            vertex(this.points[i].x, this.points[i].y);
        }
        endShape();
        // desenha a linha no meio do caminho e circulos nas pontas, para indicar os pontos do caminho
        stroke(255);
        strokeWeight(1);
        noFill();
        beginShape();
        for (let i = 0; i < this.points.length; i++) {
            vertex(this.points[i].x, this.points[i].y);
            ellipse(this.points[i].x,  this.points[i].y, 10, 10)
        }
        endShape();
    };
}
