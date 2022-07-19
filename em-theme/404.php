<?php
/*
the template for displaying 404 pages (not found)
*/
get_header();
?>
 
<section id="content" class="sec-gap">
	<div class="container">
		<div class="row">
			<div class="col-md-8 col-md-offset-2">				
				<div class="page-404-content text-center sec-pad pad-b-0">
					<h1 class="error-code"><?php esc_html_e( '404', 'lili-blog' ); ?></h1>
					<h3 class="page-title mb-0"><?php esc_html_e( 'Oops! That page can&rsquo;t be found.', 'lili-blog' ); ?></h3>
					
					<div class="mb-30">	
						<p>
							<?php esc_html_e( 'It looks like nothing was found at this location. Maybe try one of the links below or a search?', 'lili-blog' ); ?>
						</p>
					</div>

					<?php get_search_form(); ?>

					<div class="back_home">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><i class="fa fa-angle-double-left"></i><?php esc_html_e( 'Back to Home', 'lili-blog' ); ?></a>
					</div>
				</div><!-- .error-404 -->				
			</div>
			<!-- #primary -->
		</div>
	</div>
</section> 
<?php
get_footer();