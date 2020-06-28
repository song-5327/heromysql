
// 1. 导包 
const express = require('express');
const multer=require('multer');
const path=require('path');
const hm = require('mysql-ithm');
const cors=require('cors');
const { log } = require('console');
const bodyParser=require('body-parser')
// 自动创建一个保存前端传过来的文件参数的文件夹
let upload = multer({ dest: path.join(__dirname,'www','uploads/') })


//连接数据库
//如果数据库存在则连接，不存在则会自动创建数据库
hm.connect({
    host: 'localhost',//数据库地址
    port:'3306',
    user: 'root',//用户名，没有可不填
    password: 'root',//密码，没有可不填
    database: 'cqmanager'//数据库名称
});
 
//创建Model(表格模型：负责增删改查)
//如果table表格存在则连接，不存在则自动创建
let xqModel = hm.model('cqhero',{
    heroName:String,
    heroSkill:String,
    heroIcon:String,
    isDelete:String
});
let user = hm.model('user',{
    username:String,
    password:String,
   
});


// 2. 创建服务器 
var app = express();
// 调用express.static方法 把 www文件夹心里面的文件暴露出去
app.use(express.static("www"));
// 转换为 urlencoded的格式
app.use(bodyParser.urlencoded({ extended: false }))
// 跨域 
app.use(cors());

// 3.路由
// 01-获取所有英雄
app.get('/hero/all', upload.single('heroIcon'), (req, res)=> {
    // 判断用户有没有传入search数据查询
    // 如果有search ：使用模糊查询 如果没有 返回所有英雄
    let {search}=req.query;
    if(!search){
        // 如果没有传递参数 返回所有未删除的英雄
        xqModel.sql(`select * from cqhero where isDelete="false" order by id desc`,(err,results)=>{
            if(err){
                res.send({
                    code:500,
                    msg:"服务器内部错误",                
                    });
            }else{
                res.send({
                    code:200,
                    msg:"查询成功！", 
                    data:results                 
            }); 
        };     
    });
        }else{
            // 传了参数 使用模糊胡查询返回数据
            xqModel.find(`heroName like "%${search}%" and isDelete='false'`,(err,results)=>{
                if(err){
                    res.send({
                        code:500,
                        msg:"服务器内部错误！",
                       
                        });
                }else{
                    res.send({
                        code:200,
                        msg:"查询成功！",  
                        data:results                
                }); 
            };     
            });
        }   
});
//02-新增英雄
app.post('/hero/add', upload.single('heroIcon'), (req, res)=> {
    // 获取前端传递过来的数据 name skill icon 
    let heroIcon="http://127.0.0.1:5051/uploads/"+req.file.filename;
    let{heroName,heroSkill}=req.body;

    // 调用第三方模块方法 把数据存到数据库
    xqModel.insert({heroName:heroName,heroSkill:heroSkill,heroIcon:heroIcon,isDelete:'false'},(err,results)=>{
        if(!err) {
            res.send({
                code:200,
                msg:"新增成功!"
            });
        }else{
            res.send({
                code:500,
                msg:"新增失败!"
            });
        }
    });


});
//03-根据id查询英雄详情(编辑第一步)
app.get('/hero/info', (req, res)=> {
    //获取前端传递过来的id信息 返回该id英雄的详细信息
    let{id} =req.query;

      //使用mysql方法 根据id信息 返回英雄数据信息
      xqModel.find( `id="${id}" and isDelete="false"`,(err,results)=>{
        if(err==null){
         res.send({
            code:200,
            msg:"查询成功",
            data:results
         });
        }
    });

});
//04-编辑英雄(第二步)
app.post('/hero/edit', upload.single('heroIcon'), (req, res)=> {
    //获取前端传递过来的参数信息
    // console.log(req.file.filename);// 获取头像文件
    // console.log(req.body); //获取英雄名称 技能 id
    let{id,heroName,heroSkill}=req.body;
    let heroIcon="http://127.0.0.1:5051/uploads/"+req.file.filename;
    // 调用第三方模块方法 根据修改条件 把数据存到数据库
    xqModel.update('id='+id,{heroName,heroSkill,heroIcon},(err,results)=>{
        if(!err) {
            res.send({
                code:201,
                msg:"修改成功!"
            });
        }else{
            res.send({
                code:500,
                msg:"服务器内部错误!"
            });
        }
    });


});
//05-英雄删除
app.get('/hero/delete', (req, res)=> {
    // console.log(req.query); //查看信息
    // 获取前端传递过来的id信息 
    let {id}=req.query;
    xqModel.sql(`update cqhero set isDelete='true' where id = '${id}'`,(err,results)=>{
       if(!err){
           res.send({
                code:204,
                msg:"删除成功！"
           });
       }else{
        res.send({
            code:500,
            msg:"服务器内部错误"
       });
       }
    });
    
});
//06-登录 
app.post('/login', (req, res)=> {
    // 获取前端传递过来的 用户名 和密码
    console.log(req.body);
    let{username,password}=req.body

    user.find(`username="${username}" and password="${password}"`,(err,results)=>{
        console.log(results);
        if(!err){
            if(results.length>0){
                res.send({
                    code:200,
                    msg:"登陆成功"
                })
            }else{
                res.send({
                    code:201,
                    msg:"登陆失败"
                })
            }
        }else{
            res.send({
                code:500,
                msg:"服务器错误"
            })
        }
    });
});



// 4. 服务器开启成功
app.listen(5051,()=>{
    console.log('服务器开启成功5051');
    
})