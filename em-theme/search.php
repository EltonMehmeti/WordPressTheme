<?php 
/*
Template Name: Search Page
*/
?>
<?php 
get_header(); ?>
?>
	<div class="wrap"> 
	<div id="primary" class="content-area">
		<main id="main" class="site-main">

			<h1 class="searchh1">Search Post</h1>
			<p>
			My Site features articles about
			<a title="WordPress Articles" href="">WordPress</a>
			<a title="Web Design Articles" href="">Web Page Design</a>
			<a title="Development Articles" href="">Website Development</a>, 
			and <a title="CSS Articles" href="">CSS</a>
			</p>
			<p>To search my website, please use the form below</p>
			<?php get_search_form(); ?>
			<a href="index.php?page_id=5" title="Search Page">Search Page</a>

		</main><!-- #main -->
	</div><!-- #primary -->
</div><!--#wrap-->
<?php
get_footer();
?>