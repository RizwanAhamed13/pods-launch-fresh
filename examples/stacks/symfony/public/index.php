<?php
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
require dirname(__DIR__).'/vendor/autoload.php';
class Kernel extends BaseKernel {
    use MicroKernelTrait;
    public function getProjectDir(): string { return dirname(__DIR__); }
    public function registerBundles(): iterable { yield new FrameworkBundle(); }
    protected function configureContainer(ContainerConfigurator $container): void {
        $container->extension('framework', ['secret'=>'public-counter-fixture','router'=>['utf8'=>true]]);
    }
    protected function configureRoutes(RoutingConfigurator $routes): void {
        $routes->add('product','/')->controller([$this,'product']);
        $routes->add('counter','/api/count')->methods(['GET','POST'])->controller([$this,'counter']);
    }
    public function product(): Response { return new Response(file_get_contents(dirname(__DIR__).'/product.html')); }
    public function counter(Request $request): JsonResponse {
        $dir=getenv('PODS_APP_DATA') ?: '/data';
        if (!is_dir($dir)) mkdir($dir,0770,true);
        $db=new PDO('sqlite:'.$dir.'/counter.sqlite');
        $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
        $db->exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY,value INTEGER NOT NULL); INSERT OR IGNORE INTO counter VALUES(1,0)');
        if($request->isMethod('POST')) $db->exec('UPDATE counter SET value=value+1 WHERE id=1');
        return new JsonResponse(['count'=>(int)$db->query('SELECT value FROM counter WHERE id=1')->fetchColumn()]);
    }
}
$kernel=new Kernel('prod',false);
$request=Request::createFromGlobals();
$response=$kernel->handle($request);$response->send();$kernel->terminate($request,$response);
