var Admin = require('../models/Admin');
var Config = require('../models/Config');
var Etiqueta = require('../models/Etiqueta');
var Variedad = require('../models/Variedad');
var Inventario = require('../models/Inventario');
var Producto = require('../models/Producto');
var Producto_etiqueta = require('../models/Producto_etiqueta');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../helpers/jwt');

var Direccion = require('../models/Direccion');
var Venta = require('../models/Venta');
var Dventa = require('../models/Dventa');
var Carrito = require('../models/Carrito');
var Contacto = require('../models/Contacto');
var fs = require('fs');
var handlebars = require('handlebars');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');
const { config } = require('process');

const login_admin = async function(req,res){
var data = req.body;
    var admin_arr = [];

    admin_arr = await Admin.find({email:data.email});

    if(admin_arr.length == 0){
        res.status(200).send({message: 'El correo electrónico no existe', data: undefined});
    }else{
        //LOGIN
        let user = admin_arr[0];

        bcrypt.compare(data.password, user.password, async function(error,check){
            if(check){
                res.status(200).send({
                    data:user,
                    token: jwt.createToken(user)
                });
            }else{
                res.status(200).send({message: 'Las credenciales no coinciden', data: undefined}); 
            }
        });
 
    } 
    
}

const listar_etiquetas_admin = async function(req,res){
    if(req.user){
        try {
            var reg = await Etiqueta.find();
            res.status(200).send({data:reg});
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const eliminar_etiqueta_admin = async function(req,res){
    if(req.user){
        try {
            var id = req.params['id'];

            let reg = await Etiqueta.deleteOne({_id:id});
            res.status(200).send({data:reg});
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const agregar_etiqueta_admin = async function(req,res){
    if(req.user){
        try {
            let data = req.body;

            data.slug = data.titulo.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');
            var reg = await Etiqueta.create(data);
            res.status(200).send({data:reg});
        } catch (error) {
            res.status(200).send({data:undefined,message:'Etiqueta ya existente'});
            
        }
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const registro_producto_admin = async function(req,res){
    if(req.user){
        try {
            let data = req.body;
    
            let productos = await Producto.find({titulo:data.titulo});
            
            let arr_etiquetas = JSON.parse(data.etiquetas);

            if(productos.length == 0){
                var img_path = req.files.portada.path;
                var name = img_path.split('/');
                var portada_name = name[2];

                data.slug = data.titulo.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');
                data.portada = portada_name;
                let reg = await Producto.create(data);

                if(arr_etiquetas.length >= 1){
                    for(var item of arr_etiquetas){
                        await Producto_etiqueta.create({
                            etiqueta: item.etiqueta,
                            producto: reg._id,
                        });
                    }
                }

                res.status(200).send({data:reg});
            }else{
                res.status(200).send({data:undefined, message: 'El título del producto ya existe'});
            }
        } catch (error) {
            res.status(200).send({message:error});
        }
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

listar_productos_admin = async function(req,res){
    if(req.user){
        try {
            var productos = await Producto.find();
            res.status(200).send({data:productos});
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    } 
}

listar_variedades_productos_admin = async function(req,res){
    if(req.user){
        try {
            var productos = await Variedad.find().populate('producto');
            res.status(200).send({data:productos});

        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    } 
}

const obtener_producto_admin = async function(req,res){
    if(req.user){
        var id = req.params['id'];

        try {
            var reg = await Producto.findById({_id:id});
            res.status(200).send({data:reg});
        } catch (error) {
            res.status(200).send({data:undefined});
        }
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const listar_etiquetas_producto_admin = async function(req,res){
    if(req.user){
        try {
            var id = req.params['id'];
            var etiquetas = await Producto_etiqueta.find({producto:id}).populate('etiqueta');
            res.status(200).send({data:etiquetas});
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const eliminar_etiqueta_producto_admin = async function(req,res){
    if(req.user){
        var id = req.params['id'];
       // console.log(id);
        let reg = await Producto_etiqueta.deleteOne({_id:id});
        res.status(200).send({data:reg});
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const agregar_etiqueta_producto_admin = async function(req,res){
    if(req.user){
        try {
            let data = req.body;

            var reg = await Producto_etiqueta.create(data);
            res.status(200).send({data:reg});
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
       
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const obtener_portada = async function(req,res){
    var img = req.params['img'];


    fs.stat('./uploads/productos/'+img, function(err){
        if(!err){
            let path_img = './uploads/productos/'+img;
            res.status(200).sendFile(path.resolve(path_img));
        }else{
            let path_img = './uploads/default.jpg';
            res.status(200).sendFile(path.resolve(path_img));
        }
    })
}

const actualizar_producto_admin = async function(req,res){
    if(req.user){
        try {
            let id = req.params['id'];
            let data = req.body;

            if(req.files){
                //SI HAY IMAGEN
                var img_path = req.files.portada.path;
                var name = img_path.split('/');
                var portada_name = name[2];

                let reg = await Producto.updateOne({_id:id},{
                    titulo: data.titulo,
                    stock: data.stock,
                    precio_antes_soles: data.precio_antes_soles,
                    precio_antes_dolares: data.precio_antes_dolares,
                    precio: data.precio,
                    precio_dolar: data.precio_dolar,
                    peso: data.peso,
                    sku: data.sku,
                    categoria: data.categoria,
                    visibilidad: data.visibilidad,
                    descripcion: data.descripcion,
                    contenido:data.contenido,
                    portada: portada_name
                });

                fs.stat('./uploads/productos/'+reg.portada, function(err){
                    if(!err){
                        fs.unlink('./uploads/productos/'+reg.portada, (err)=>{
                            if(err) throw err;
                        });
                    }
                })

                res.status(200).send({data:reg});
            }else{
                //NO HAY IMAGEN
            let reg = await Producto.updateOne({_id:id},{
                titulo: data.titulo,
                stock: data.stock,
                precio_antes_soles: data.precio_antes_soles,
                    precio_antes_dolares: data.precio_antes_dolares,
                precio: data.precio,
                precio_dolar: data.precio_dolar,
                    peso: data.peso,
                    sku: data.sku,
                categoria: data.categoria,
                visibilidad: data.visibilidad,
                descripcion: data.descripcion,
                contenido:data.contenido,
            });
            res.status(200).send({data:reg});
            }
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const listar_variedades_admin = async function(req,res){
    if(req.user){
        
        try {
            var id = req.params['id'];
            let pro=await Producto.find({_id:id});
           
            let data = await Variedad.find({producto:id}).populate('producto');
            res.status(200).send({data:data, producto:pro});       
        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const actualizar_producto_variedades_admin = async function(req,res){
    if(req.user){
        try {
            let id = req.params['id'];
            let data = req.body;

            //console.log(data.titulo_variedad);
            let reg = await Producto.updateOne({_id:id},{
                titulo_variedad: data.titulo_variedad,
            });
            res.status(200).send({data:reg});

        } catch (error) {
            res.status(200).send({message:'Algo salió mal'});
        }
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const eliminar_variedad_admin = async function(req,res){
    if(req.user){
        try {
            var id = req.params['id'];
            let inv = await Inventario.find({variedad:id});
            //console.log(inv);
            if(inv.length==0){
                let reg = await Variedad.deleteOne({_id:id});
                
                res.status(200).send({message:"Variedad eliminada"});
            }else{

                res.status(200).send({message:"No se puede eliminar, tiene inventario"});
            }
        } catch (error) {
            //console.log(error);
            res.status(200).send({message:"Algo salió mal"});
        }
        
            
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const agregar_nueva_variedad_admin = async function(req,res){
    if(req.user){
        try {
            var data = req.body;

           // console.log(data);
            let con = await Variedad.find({producto:data.producto,valor:data.valor});
            if(con.length==0){

                let reg = await Variedad.create(data);

                res.status(200).send({data:reg});
            }else{
                res.status(200).send({message:"Está varidad ya existe"});
            }
        } catch (error) {
            res.status(200).send({message:"Algo salió mal"});
        }
        
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}


const listar_inventario_producto_admin = async function(req,res){
    if(req.user){
        var id = req.params['id'];

        var reg = await Inventario.find({producto: id}).populate('variedad').sort({createdAt:-1});
        res.status(200).send({data:reg});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}
const listar_inventario_admin = async function(req,res){
    if(req.user){
        //console.log(req.user);
        var reg = await Inventario.find().sort({createdAt:-1}).populate('producto');
        res.status(200).send({data:reg});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const registro_inventario_producto_admin = async function(req,res){
    if(req.user){
        let data = req.body;

        let reg = await Inventario.create(data);

        //OBTENER EL REGISTRO DE PRODUCTO
        let prod = await Producto.findById({_id:reg.producto});
        let varie = await Variedad.findById({_id:reg.variedad});

        //CALCULAR EL NUEVO STOCK        
        //STOCK ACTUAL         
        //STOCK A AUMENTAR
        let nuevo_stock = parseInt(prod.stock) + parseInt(reg.cantidad);

        let nuevo_stock_vari = parseInt(varie.stock) + parseInt(reg.cantidad);

        //ACTUALICACION DEL NUEVO STOCK AL PRODUCTO
        let producto = await Producto.updateOne({_id:reg.producto},{
            stock: nuevo_stock
        });

        let variedad = await Variedad.updateOne({_id:reg.variedad},{
            stock: nuevo_stock_vari
        });

        res.status(200).send({data:reg});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}
const eliminar_inventario_producto_admin = async function(req,res){
    if(req.user){
        let data = req.body;
        //console.log("373",data);

        //OBTENER EL REGISTRO DE PRODUCTO
        let prod = await Producto.findById({_id:data.producto});
        let varie = await Variedad.findById({_id:data.variedad._id});

        //CALCULAR EL NUEVO STOCK        
        //STOCK ACTUAL         
        //STOCK A AUMENTAR
        let nuevo_stock = parseInt(prod.stock) - parseInt(data.cantidad);

        let nuevo_stock_vari = parseInt(varie.stock) - parseInt(data.cantidad);
        if(nuevo_stock >=0 && nuevo_stock_vari>=0){
            let reg = await Inventario.deleteOne({_id:data._id});
            //console.log("387",reg);
            //ACTUALICACION DEL NUEVO STOCK AL PRODUCTO
            let producto = await Producto.updateOne({_id:data.producto},{
                stock: nuevo_stock
            });

            let variedad = await Variedad.updateOne({_id:data.variedad._id},{
                stock: nuevo_stock_vari
            });

            
           // console.log("Eliminado");
            res.status(200).send({message:'Eliminado'});

        }else{
           // console.log("Nop");
            res.status(200).send({message:'No se puede eliminar de inventario'});
        }
       
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const agregar_imagen_galeria_admin = async function(req,res){
    if(req.user){
        let id = req.params['id'];
            let data = req.body;

            var img_path = req.files.imagen.path;
            var name = img_path.split('/');
            var imagen_name = name[2];

            let reg =await Producto.updateOne({_id:id},{ $push: {galeria:{
                imagen: imagen_name,
                _id: data._id
            }}});

            res.status(200).send({data:reg});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const eliminar_imagen_galeria_admin = async function(req,res){
    if(req.user){
        let id = req.params['id'];
        let data = req.body;


        let reg =await Producto.updateOne({_id:id},{$pull: {galeria: {_id:data._id}}});
        res.status(200).send({data:reg});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const verificar_token = async function(req,res){
    //console.log(req.user);
    if(req.user){
        res.status(200).send({data:req.user});
    }else{
       // console.log(2);
        res.status(500).send({message: 'NoAccess'});
    } 
}

const cambiar_vs_producto_admin = async function(req,res){
    if(req.user){
        var id = req.params['id'];
        var estado = req.params['estado'];

        try {
            if(estado == 'Edicion'){
                await Producto.updateOne({_id:id},{estado:'Publicado'});
               // console.log(true);
                res.status(200).send({data:true});
            }else if(estado == 'Publicado'){
               // console.log(true);
                await Producto.updateOne({_id:id},{estado:'Edicion'});
                res.status(200).send({data:true});
            }
        } catch (error) {
            res.status(200).send({data:undefined});
        }
        
     }else{
         res.status(500).send({message: 'NoAccess'});
     }
}
const eliminar_producto = async function(req,res){
    if(req.user){
        var id = req.params['id'];
        try {
            var prodc = await Producto.findById({_id:id}); 
           // console.log(prodc);
            if(prodc==null){
                res.status(200).send({message: 'Producto no encontrado'});
            }else{
                if(prodc.nventas==0){
                    await Producto_etiqueta.deleteMany({producto:id});
                    await Producto.deleteOne({_id:id});
                    res.status(200).send({message: 'Producto eliminado'});
                }else{
                    
                    res.status(200).send({message: 'No se puede eliminar este producto'});
                }
            }
        } catch (error) {
            res.status(200).send({data:undefined});
        }
        
     }else{
         res.status(500).send({message: 'NoAccess'});
     }
}

const obtener_config_admin = async (req,res)=>{
    let config = await Config.findById({_id:'61abe55d2dce63583086f108'});
    res.status(200).send({data:config});
}

const actualizar_config_admin = async (req,res)=>{
    if(req.user){
        let data = req.body;
        let config = await Config.updateOne({_id:'61abe55d2dce63583086f108'},{
            envio_activacion : data.envio_activacion,
            monto_min_soles: data.monto_min_soles,
            monto_min_dolares : data.monto_min_dolares
        });
        res.status(200).send({data:config});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
    
}

const pedido_compra_cliente = async function(req,res){
    if(req.user){
        try {
            var data = req.body;
            var detalles = data.detalles;
            let access = false;
            let producto_sl = '';

            for(var item of detalles){
                let variedad = await Variedad.findById({_id:item.variedad}).populate('producto');
                if(variedad.stock < item.cantidad){
                    access = true;
                    producto_sl = variedad.producto.titulo;
                }
            }

            if(!access){
                data.estado = 'En espera';
                data.f_estado= new Date();
                let venta = await Venta.create(data);
        
                for(var element of detalles){
                    element.venta = venta._id;
                    await Dventa.create(element);
                    await Carrito.deleteOne({cliente:data.cliente});
                }
                enviar_email_pedido_compra(venta._id);
                res.status(200).send({venta:venta});
            }else{
                res.status(200).send({venta:undefined,message:'Stock insuficiente para ' + producto_sl});
            }
        } catch (error) {
           // console.log(error);
        }

        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}


const enviar_email_pedido_compra = async function(venta){
    try {
        var readHTMLFile = function(path, callback) {
            fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
                if (err) {
                    throw err;
                    callback(err);
                }
                else {
                    callback(null, html);
                }
            });
        };
    
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'riocompratienda@gmail.com',
                pass: 'ggwyyugeecxrhosh'
            }
        }));
    
     
        var orden = await Venta.findById({_id:venta}).populate('cliente').populate('direccion');
        var dventa = await Dventa.find({venta:venta}).populate('producto').populate('variedad');
    
    
        readHTMLFile(process.cwd() + '/mails/email_pedido.html', (err, html)=>{
                                
            let rest_html = ejs.render(html, {orden: orden, dventa:dventa});
    
            var template = handlebars.compile(rest_html);
            var htmlToSend = template({op:true});
    
            var mailOptions = {
                from: 'riocompratienda@gmail.com',
                to: orden.cliente.email,
                subject: 'Gracias por tu orden, RioCompras.',
                html: htmlToSend
            };
          
            transporter.sendMail(mailOptions, function(error, info){
                if (!error) {
                   // console.log('Email sent: ' + info.response);
                }
            });
        
        });
    } catch (error) {
       // console.log(error);
    }
} 

const obtener_ventas_admin  = async function(req,res){
    if(req.user){
        let ventas = [];
            let desde = req.params['desde'];
            let hasta = req.params['hasta'];

            ventas = await Venta.find().populate('cliente').populate('admin').populate('admin_envio').populate('direccion').sort({createdAt:-1});
            res.status(200).send({data:ventas});

            
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const obtener_detalles_ordenes_cliente  = async function(req,res){
    if(req.user){
        var id = req.params['id'];

        try {
            let venta = await Venta.findOne({_id:id}).populate('cliente').populate('admin').populate('admin_envio').populate('direccion');
           // console.log(venta);
            let detalles = await Dventa.find({venta:venta._id}).populate('producto').populate('variedad');
            res.status(200).send({data:venta,detalles:detalles});

        } catch (error) {
          //  console.log(error);
            res.status(200).send({data:undefined});
        }
        
        
        
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const marcar_finalizado_orden = async function(req,res){
    if(req.user){

        var id = req.params['id'];
        let data = req.body;

        var venta = await Venta.updateOne({_id:id},{
            estado: 'Finalizado',
            f_estado: new Date()
        });

        res.status(200).send({data:venta});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const eliminar_orden_admin = async function(req,res){
    if(req.user){

        var id = req.params['id'];

        var venta = await Venta.deleteOne({_id:id});
        await Dventa.deleteOne({venta:id});

        res.status(200).send({data:venta});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const marcar_envio_orden = async function(req,res){
    if(req.user){

        var id = req.params['id'];
        let data = req.body;
        var vconf = await Venta.findById(id);
        if(vconf.admin){
            var venta = await Venta.updateOne({_id:id},{
                tracking: data.tracking,
                estado: 'Enviado',
                f_estado: new Date(),
                admin_envio: req.user.sub
            });
        }else{
            var venta = await Venta.updateOne({_id:id},{
                tracking: data.tracking,
                estado: 'Enviado',
                f_estado: new Date(),
                admin: req.user.sub,
                admin_envio: req.user.sub
            });
        }
        

        mail_confirmar_envio(id);

        res.status(200).send({data:venta});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const confirmar_pago_orden = async function(req,res){
    if(req.user){

        var id = req.params['id'];
        let data = req.body;
        var er=-1;
        var p_error, v_error;

        var detalles = await Dventa.find({venta:id});
        //Verifica si hay problemas de de stock
        for(var element of detalles){
            let element_producto = await Producto.findById({_id:element.producto});
            let new_stock = element_producto.stock - element.cantidad;
            let new_ventas = element_producto.nventas + 1;

            let element_variedad = await Variedad.findById({_id:element.variedad});
            let new_stock_variedad = element_variedad.stock - element.cantidad;
            if(new_stock<0&&new_stock_variedad<0){
                er=0;
                p_error=element_producto.titulo;
                v_error=element_variedad.valor;
            }                
        }
        if(er==-1){
            //no hay error, grabar
            var venta = await Venta.updateOne({_id:id},{
                estado: 'Procesando',
                f_estado: new Date(),
                admin: req.user.sub
            });
            for(var element of detalles){
                let element_producto = await Producto.findById({_id:element.producto});
                let new_stock = element_producto.stock - element.cantidad;
                let new_ventas = element_producto.nventas + 1;
    
                let element_variedad = await Variedad.findById({_id:element.variedad});
                let new_stock_variedad = element_variedad.stock - element.cantidad;
                await Producto.updateOne({_id: element.producto},{
                    stock: new_stock,
                    nventas: new_ventas
                });
        
                await Variedad.updateOne({_id: element.variedad},{
                    stock: new_stock_variedad,
                });                
                
            }
            
            res.status(200).send({data:venta});
        }else{
            //hay error, mandar mensaje del producto con el error
            res.status(200).send({message: 'No hay en inventario el siguiente producto: '
            +p_error +', de variedad: '+v_error });  
        }
        

    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}


const mail_confirmar_envio = async function(venta){
    try {
        var readHTMLFile = function(path, callback) {
            fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
                if (err) {
                    throw err;
                    callback(err);
                }
                else {
                    callback(null, html);
                }
            });
        };
    
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'riocompratienda@gmail.com',
                pass: 'ggwyyugeecxrhosh'
            }
        }));
    
     
        var orden = await Venta.findById({_id:venta}).populate('cliente').populate('direccion');
        var dventa = await Dventa.find({venta:venta}).populate('producto').populate('variedad');
    
    
        readHTMLFile(process.cwd() + '/mails/email_enviado.html', (err, html)=>{
                                
            let rest_html = ejs.render(html, {orden: orden, dventa:dventa});
    
            var template = handlebars.compile(rest_html);
            var htmlToSend = template({op:true});
    
            var mailOptions = {
                from: 'riocompratienda@gmail.com',
                to: orden.cliente.email,
                subject: 'Tu pedido ' + orden._id + ' fué enviado',
                html: htmlToSend
            };
          
            transporter.sendMail(mailOptions, function(error, info){
                if (!error) {
                    //console.log('Email sent: ' + info.response);
                }
            });
        
        });
    } catch (error) {
       // console.log(error);
    }
} 

const registro_compra_manual_cliente = async function(req,res){
    if(req.user){

        var data = req.body;
        var detalles = data.detalles;

        data.estado = 'Procesando';
        data.f_estado= new Date();
        data.admin = req.user.sub;
        //console.log(data);

        let venta = await Venta.create(data);
       // console.log(venta);
        for(var element of detalles){
            element.venta = venta._id;
            element.cliente = venta.cliente;
            await Dventa.create(element);

            let element_producto = await Producto.findById({_id:element.producto});
            let new_stock = element_producto.stock - element.cantidad;
            let new_ventas = element_producto.nventas + 1;

            let element_variedad = await Variedad.findById({_id:element.variedad});
            let new_stock_variedad = element_variedad.stock - element.cantidad;

            await Producto.updateOne({_id: element.producto},{
                stock: new_stock,
                nventas: new_ventas
            });

            await Variedad.updateOne({_id: element.variedad},{
                stock: new_stock_variedad,
            });
        }
        let dlocal = await Direccion.findById(data.direccion);
     //   console.log(dlocal);
        if(dlocal.length>0){
            if(dlocal[0].direccion!='Local Comercial'){
                enviar_orden_compra(venta._id);
            }
        }

        res.status(200).send({venta:venta});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}

const enviar_orden_compra = async function(venta){
    try {
        var readHTMLFile = function(path, callback) {
            fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
                if (err) {
                    throw err;
                    callback(err);
                }
                else {
                    callback(null, html);
                }
            });
        };
    
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'riocompratienda@gmail.com',
                pass: 'ggwyyugeecxrhosh'
            }
        }));
    
     
        var orden = await Venta.findById({_id:venta}).populate('cliente').populate('direccion');
        var dventa = await Dventa.find({venta:venta}).populate('producto').populate('variedad');
    
    
        readHTMLFile(process.cwd() + '/mails/email_compra.html', (err, html)=>{
                                
            let rest_html = ejs.render(html, {orden: orden, dventa:dventa});
    
            var template = handlebars.compile(rest_html);
            var htmlToSend = template({op:true});
    
            var mailOptions = {
                from: 'riocompratienda@gmail.com',
                to: orden.cliente.email,
                subject: 'Confirmación de compra ' + orden._id,
                html: htmlToSend
            };
          
            transporter.sendMail(mailOptions, function(error, info){
                if (!error) {
                   // console.log('Email sent: ' + info.response);
                }
            });
        
        });
    } catch (error) {
        //console.log(error);
    }
}
const listar_mensaje_contacto  = async function(req,res){
    

        if(req.user){
            var reg = await Contacto.find();
            res.status(200).send({data:reg});
        }else{
            res.status(500).send({message: 'NoAccess'});
        }
    
    

}
const  cerrar_mensaje_contacto  = async function(req,res){
    
    
    if(req.user){
        var id = req.params['id'];
        var reg = await Contacto.updateOne({_id:id},{
            estado:'Cerrado'
        });
        res.status(200).send({message:'Cerrado con Exito'});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }

}
const registro_admin = async function(req,res){
    if(req.user){
        try {
            var data = req.body;
            var admin_arr = [];
            admin_arr = await Admin.find({email:data.email});

            var admin_arr2=[];
            admin_arr2= await Admin.find({dni:data.dni});
            
            var admin_arr3=[];
            admin_arr3= await Admin.find({rol:'direc'});
           
            if(admin_arr.length == 0 && admin_arr2.length==0){
                if((admin_arr3.length!=0 && data.rol!='direc')||(admin_arr3.length==0)){
                    try {
                        bcrypt.hash(data.password,null,null, async function(err,hash){
                            if(hash){
                                
                                data.password = hash;
                                data.estado = 'habilitado';
                                var reg = await Admin.create(data);
                                  res.status(200).send({message:'Registrado con exito'});
                            }else{
                                res.status(200).send({message:'ErrorServer'});
                            }
                        });
                    } catch (error) {
                        //console.log("1",error);
                        res.status(200).send({message:'Algo salió mal'});
                    }
                }else{
                    res.status(200).send({message:'Ya hay una cuenta con el rol de Director'});
                }
            }else{
                if((admin_arr.length != 0 && admin_arr[0].estado=='Fuera')||(admin_arr2.length != 0 && admin_arr2[0].estado=='Fuera')||(admin_arr3.length != 0 && admin_arr3[0].estado=='Fuera')){
                    try {
                        bcrypt.hash(data.password,null,null, async function(err,hash){
                            if(hash){
                                
                                data.password = hash;
                                data.estado = 'habilitado';
                                var reg = await Admin.updateOne({email:data.email},{
                                    nombres: data.nombres,
                                    apellidos: data.apellidos,
                                    password: data.password,
                                    rol: 'secrt',
                                    dni:data.dni,
                                    telefono: data.telefono,
                                    estado:data.estado
                                });

                                  res.status(200).send({message:'Registrado con exito'});
                            }else{
                                res.status(200).send({message:'ErrorServer'});
                            }
                        });
                    } catch (error) {
                        //console.log("2",error);
                        res.status(200).send({message:'Algo salió mal'});
                    }
                }else{
                res.status(200).send({message:'El correo y/o la cedula ya existe en la base de datos'});
                }
            }

        } catch (error) {
            //console.log("3",error);
            res.status(200).send({message:'Algo salió mal'});
        }            
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}
const obtener_admin = async function(req,res){
    if(req.user){
        var id = req.params['id'];
        try {
            let estudiante = await Admin.findById({_id:id});
        
            res.status(200).send({data:estudiante});
            
        } catch (error) {
            res.status(200).send({data:undefined});
        }
    }else{

        res.status(500).send({message: 'NoAccess'});
    }
}
const actualizar_admin = async function(req,res){
    if(req.user){
        try {
            
            var id = req.params['id'];
            var data = req.body;
            let admin = await Admin.findById(id);
            ////console.log(admin);
            ////console.log('Data:',data);
            var admin_arr = [];
            var aux= await Admin.find();
            aux=aux.filter((item)=>item.dni==data.dni);
            aux=aux.filter((item)=>item._id!=id);
            admin_arr = await Admin.find({email:data.email});
            ////console.log('1:',admin_arr);
            admin_arr=admin_arr.filter((item)=>item._id!=id);
            ////console.log('2:',admin_arr);
            if(admin_arr.length==1 || aux.length>=1){
                res.status(200).send({message:'Correo o cedula ya existente',data:undefined});
            }else{
                
                if(data.password!=''){
                    bcrypt.hash(data.password,null,null, async function(err,hash){
                        if(hash){
                            data.password = hash;
                            ////console.log(data.password);
                            var admin_arr3=[];
                            admin_arr3= await Admin.find({rol:'direc',_id:{$ne:id}});
                            if((admin_arr3.length!=0 && data.rol!='direc')||(admin_arr3.length==0)){
                                await Admin.updateOne({_id:id},{
                                    estado:data.estado,
                                    nombres:data.nombres,
                                    apellidos:data.apellidos,
                                    email:data.email,
                                    password:data.password,
                                    telefono:data.telefono,
                                    rol:data.rol,
                                    dni:data.dni,
                                   
                                });

                                res.status(200).send({message:'Actualizado con exito'});
                            }else{
                                await Admin.updateOne({_id:id},{
                                    estado:data.estado,
                                    nombres:data.nombres,
                                    apellidos:data.apellidos,
                                    email:data.email,
                                    password:data.password,
                                    telefono:data.telefono,
                                    rol:'secrt',
                                    dni:data.dni,
                                   
                                });
                                res.status(200).send({message:'Actualizado con exito se cambio el rol a Colecturía'});
                            }
                           
                        }else{
                            res.status(200).send({message:'ErrorServer',data:undefined});
                        } 
                    });
                }else{
                    var admin_arr3=[];
                            admin_arr3= await Admin.find({rol:'direc',_id:{$ne:id}});
                            if((admin_arr3.length!=0 && data.rol!='direc')||(admin_arr3.length==0)){
                                await Admin.updateOne({_id:id},{
                                    estado:data.estado,
                                    nombres:data.nombres,
                                    apellidos:data.apellidos,
                                    email:data.email,
                                    
                                    telefono:data.telefono,
                                    rol:data.rol,
                                    dni:data.dni,
                                   
                                });
                                res.status(200).send({message:'Actualizado con exito'});
                            }else{
                                await Admin.updateOne({_id:id},{
                                    estado:data.estado,
                                    nombres:data.nombres,
                                    apellidos:data.apellidos,
                                    email:data.email,
                                    password:data.password,
                                    telefono:data.telefono,
                                    rol:'secrt',
                                    dni:data.dni,
                                   
                                });
                                res.status(200).send({message:'Actualizado con exito se cambio el rol a Colecturía'});
                            }
                }
            }
               
        }
        catch (error) {
            ////console.log(error);
            res.status(200).send({message:error+'Algo salió mal',data:undefined});
        }            
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}
const eliminar_admin = async function(req,res){
    if(req.user){
        var id = req.params['id'];
        var data = await Admin.findById(id);
        await Admin.updateOne({_id:id},{
            rol:'secrt',
            estado:'Fuera',
        });    
        res.status(200).send({message:'Eliminado con exito'});
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}
const listar_admin = async function(req,res){
    if(req.user){
        try {
           
            var admin_arr = [];
            admin_arr = await Admin.find({});
        
            res.status(200).send({data:admin_arr});

        } catch (error) {
            res.status(200).send({message:'Algo salió mal',data:undefined});
        }            
    }else{
        res.status(500).send({message: 'NoAccess'});
    }
}
const recuperar_pass =async function(req,res){
    let mail = req.body;
    if(mail=undefined){
        res.status(200).send({message:'Es necesario un correo'});
    }else{
        let mens='Check your email for a link to reset your password';
        try {
            var reg= await Admin.findOne({email:mail});
            if(reg.length==1){
                res.status(200).send({
                    data:user,
                    token: jwt.createToken(user)
                });
            }
        } catch (error) {
            res.status(200).send({message:mens});
        }
    }
}



module.exports = {
    login_admin,
    eliminar_etiqueta_admin,
    listar_etiquetas_admin,
    agregar_etiqueta_admin,
    registro_producto_admin,
    listar_productos_admin,
    obtener_producto_admin,
    listar_etiquetas_producto_admin,
    eliminar_etiqueta_producto_admin,
    agregar_etiqueta_producto_admin,
    obtener_portada,
    actualizar_producto_admin,
    listar_variedades_admin,
    actualizar_producto_variedades_admin,
    agregar_nueva_variedad_admin,
    eliminar_variedad_admin,
    listar_inventario_producto_admin,
    registro_inventario_producto_admin,
    eliminar_inventario_producto_admin,
    agregar_imagen_galeria_admin,
    eliminar_imagen_galeria_admin,
    verificar_token,
    cambiar_vs_producto_admin,
    obtener_config_admin,
    actualizar_config_admin,
    pedido_compra_cliente,
    obtener_ventas_admin,
    obtener_detalles_ordenes_cliente,
    marcar_finalizado_orden,
    eliminar_orden_admin,
    marcar_envio_orden,
    confirmar_pago_orden,
    registro_compra_manual_cliente,
    listar_variedades_productos_admin,
    listar_mensaje_contacto,
    cerrar_mensaje_contacto,
    listar_inventario_admin,
    registro_admin,
    obtener_admin,
    actualizar_admin,
    eliminar_admin,
    listar_admin,
    recuperar_pass,
    eliminar_producto 
}