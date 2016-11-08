import Koa from 'koa';
const app = new Koa();
import koaRouter from 'koa-router';
const router = koaRouter();
import views from 'koa-views';
import co from 'co';
import convert from 'koa-convert';
import json from 'koa-json';
import onerror from 'koa-onerror';
import koaBodyparser from 'koa-bodyparser';
const bodyparser = koaBodyparser();
import logger from 'koa-logger';
import path from 'path';
import fs from 'fs';

import index from './routes/index';
import users from './routes/users';
import core from './core';

let config_file = path.join(__dirname, './config.json');
let config = JSON.parse(fs.readFileSync(config_file, 'utf-8'));

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
app.use(require('koa-static')(__dirname + '/public'));

app.use(views(__dirname + '/views', {
  extension: 'jade'
}));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

router.use('/', index.routes(), index.allowedMethods());
router.use('/users', users.routes(), users.allowedMethods());

app.use(core(config));

app.use(router.routes(), router.allowedMethods());
// response

app.on('error', function(err, ctx){
  console.log(err)
  logger.error('server error', err, ctx);
});

module.exports = app;
