
<?php if ( have_posts() ) : while(have_posts( ) ) : the_post();?>








	 <?php the_content();?>
<?php echo get_the_date(); ?>

	 <?php
	 $emri = get_the_author_meta('first_name');
	 $mbiemri = get_the_author_meta('last_name');

	 ?>
	 <p>Postuar nga <?php echo $emri; ?> <?php echo $mbiemri; ?></p>


	







	<?php endwhile; else : endif;?>