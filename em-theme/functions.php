<?php
// load style sheet
function load_css()
{

	wp_register_style('bootstrap',get_template_directory_uri() . '/css/bootstrap.min.css', array(),false,'all' );
	wp_enqueue_style('bootstrap');

	wp_register_style('main',get_template_directory_uri() . '/css/main.css', array(),false,'all' );
	wp_enqueue_style('main');
}

add_action('wp_enqueue_scripts','load_css');

// load javascript
function load_js()
{
wp_enqueue_script('jquery');

	wp_register_script('bootstrap',get_template_directory_uri() . '/js/bootstrap.min.js','jquery',false,true );
	wp_enqueue_script('bootstrap');
}
add_action('wp_enqueue_scripts','load_js');

//theme options
add_theme_support('menus');
add_theme_support('post-thumbnails');
add_theme_support('widgets');
add_theme_support('post-formats',array('aside','image', 'video', 'quote'));

// Menyt

register_nav_menus(
array(
'top-menu' => 'Top Menu Location',
'mobile-menu' => 'Mobile Menu Location',



)

);


// madhesia fotov
add_image_size('post-image',900,450,false);
add_image_size('blog-small',300,200,true);






 // register sidebars

function themename_widgets_init(){
   register_sidebar(
   	array(
'name'     =>__(   'Page Sidebar',  'theme_name'),
'id'   =>'page0sidebar',
'before_widget' => '<ul><li id="%1$s" class="widget %2$s">',
'after_widget' =>'</li></ul>',
'before_title' => '<h3 class="widget-title">',
'after_title' => '</h3>',
 ) );
register_sidebar(
	array(
'name'     =>__(   'Blog Sidebar',  'theme_name'),
'id'   =>'blog0sidebar',
'before_widget' => '<ul><li id="%1$s" class="widget %2$s">',
'after_widget' =>'</li></ul>',
'before_title' => '<h3 class="widget-title">',
'after_title' => '</h3>',



)  );
register_sidebar(
	array(
'name'     =>__(   'Contactus Sidebar',  'theme_name'),
'id'   =>'contactus0sidebar',
'before_widget' => '<ul><li id="%1$s" class="widget %2$s">',
'after_widget' =>'</li></ul>',
'before_title' => '<h3 class="widget-title">',
'after_title' => '</h3>',



)  );




}

?>
  <?php  
  class My_Widget extends WP_Widget {

  public function __cibstruct()  {
// actual widget precesses
}
public function widget( $args, $instance) {
	// outputs the content of the widget
}
public function form( $instance) {
	// outputs the options form in the admin
}
public function update( $new_instane, $old_instance ) {
// processes widget opyions to be saved
}

}
add_action('widgets_init','themename_widgets_init');
?>

 
