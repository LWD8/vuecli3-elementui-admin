import Vue from 'vue'
import Router from 'vue-router'
import { getMenu } from '@/api/menu'
import store from '@/store'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

// !!!! 请认真阅读下面注释部分

/**
 * ? 路由配置规范
 * ? 当设置 true 的时候该路由不会在侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * hidden: true // (默认 false)

 * ? 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * redirect: 'noRedirect'

 * ? 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 * ? 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 * ? 若你想不管路由下面的 children 声明的个数都显示你的根路由
 * ? 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * alwaysShow: true

 * name: 'router-name' // ? 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * meta: {
 *   title: 'title', // ? 设置该路由在侧边栏和面包屑中展示的名字
 *   icon: 'svg-name', // ? 设置该路由的图标，支持 svg-class，也支持 el-icon-x element-ui 的 icon
 *   noCache: true, // ? 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
 *   breadcrumb: false, // ? 如果设置为false，则不会在breadcrumb面包屑中显示(默认 true)
 *   affix: true // ?若果设置为true，它则会固定在tags-view中(默认 false)

 * ? 当路由设置了该属性，则会高亮相对应的侧边栏。
 * ? 这在某些场景非常有用，比如：一个文章的列表页路由为：/article/list
 * ? 点击文章进入文章详情页，这时候路由为/article/1，但你想在侧边栏高亮文章列表的路由，就可以进行如下设置
 *  activeMenu: '/article/list'
 * }
 */
export const constantRoutes = [
  // 路由
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: {
          title: 'dashboard',
          icon: 'dashboard',
          affix: true
        }
      }
    ]
  }
]

import accountRouter from './modules/account'
import deviceRouter from './modules/device'
/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  // 动态路由映射
  // 404 page must be placed at the end !!!
  accountRouter,
  deviceRouter,
  {
    path: '*',
    redirect: '/404',
    hidden: true
  }
]

/**
 * 路由映射集合
 */
const _routesMap = {}

/**
 * 生成路由映射集合
 * @param {Array} routes
 */
const getRoutesMap = routes => {
  routes.forEach(item => {
    _routesMap[item.name] = item.component
    if (item.children && item.children.length > 0) {
      getRoutesMap(item.children)
    }
  })
  return _routesMap
}

export const routesMap = getRoutesMap(asyncRoutes)

const createRouter = () =>
  new Router({
    // mode: 'history', // require service support
    mode: 'hash',
    scrollBehavior: (to, from, savePosition) => ({ x: 0, y: 0 }),
    routes: constantRoutes
  })

const router = createRouter()

router.beforeEach(async (to, from, next) => {
  const menus = await store.dispatch('app/getMenus')
  if (menus.length === 0 && to.path !== '/login') {
    const { generRoutes } = await store.dispatch('permission/getMenus')
    let path = to.path
    if (
      to.path.startsWith('/home') &&
      generRoutes[0] &&
      !generRoutes[0].path.startsWith('/home')
    ) {
      path = generRoutes[0].redirect || generRoutes[0].path
    }
    next({
      ...to,
      path,
      replace: true
    })
  } else {
    next()
  }
})

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher
}

export default router
