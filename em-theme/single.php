<?php get_header();?>


<section class="page-wrap">
<div class="container">
	<section class="row">




	<?php /* if(has_post_thumbnail());?>


<img src="<?php the_post_thumbnail_url();?>" alt="<?php the_title();?>" class="img-fluid">     >


<?php endif; */
?>
<div class="col-lg-9">
	<div class="container">
		<section class="row">
		<div class="page-wrap">
<h1><?php the_title();?></h1>	

<?php if ( has_post_thumbnail() ) : ?>
    <a href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>">
        <?php the_post_thumbnail('medium_large'); ?>
    </a>
<?php endif; ?>

</div>
</div>
</section>
</div>



 


		

	<?php get_template_part('includes/section','blogcontent');?>
	<?php 

						if(comments_open()){
							comments_template();
						}  else {
							echo '<h5 class="text-center">Sorry, Comments are closed! </h5>';
						}
					?>

</div>
</div>
</div>
</section>
</section>




<?php get_footer();?>